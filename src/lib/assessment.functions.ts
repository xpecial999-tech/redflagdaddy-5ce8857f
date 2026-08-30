import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { runWhenAiAnalysisEnabled } from "@/lib/ai-analysis-config";
import {
  hasAssessmentAnswer,
  requireAssignedAssessmentQuestion,
  selectAssessmentQuestions,
  validateAssessmentAnswer,
  visibleAssessmentQuestions,
  type AnswerOption,
  type AssessmentQuestion,
} from "@/lib/assessment-questions";
import { expandRoleForFiltering } from "./roles";

const CodeSchema = z.object({ code: z.string().trim().min(4).max(64) });

// Bounded answer shapes: text capped at 4000 chars; arrays/objects capped to
// prevent storage abuse and inflated AI token costs.
const AnswerSchema = z.union([
  z.null(),
  z.boolean(),
  z.number().finite(),
  z.string().max(4000),
  z.array(z.union([z.string().max(500), z.number().finite(), z.boolean()])).max(50),
  z.record(z.string().max(100), z.union([z.string().max(500), z.number().finite(), z.boolean()])),
]);

const SaveSchema = z.object({
  code: z.string().trim().min(4).max(64),
  questionId: z.string().uuid(),
  answer: AnswerSchema,
});

const CompleteSchema = z.object({ code: z.string().trim().min(4).max(64) });

async function loadInviteContext(code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: journey, error: jErr } = await supabaseAdmin
    .from("journeys")
    .select("id, title, participant_type, status, invite_code")
    .eq("invite_code", code)
    .maybeSingle();
  if (jErr) throw new Error(jErr.message);
  if (!journey) throw new Error("Invite not found.");

  const { data: invite, error: iErr } = await supabaseAdmin
    .from("invites")
    .select("id, expires_at, completed_at")
    .eq("journey_id", journey.id)
    .eq("code", code)
    .maybeSingle();
  if (iErr) throw new Error(iErr.message);
  if (!invite) throw new Error("Invite not found.");
  if (invite.completed_at) throw new Error("This invite has already been completed.");
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error("This invite has expired.");
  }

  return { supabaseAdmin, journey, invite };
}

async function loadAssignedQuestions(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  journey: { id: string; participant_type: string },
): Promise<AssessmentQuestion[]> {
  const { data: journeySettings, error: settingsError } = await supabaseAdmin
    .from("journeys")
    .select("category_ids, question_limit, creator_id")
    .eq("id", journey.id)
    .maybeSingle();
  if (settingsError) throw new Error(settingsError.message);
  if (!journeySettings) throw new Error("Journey not found.");

  const storedCategoryIds = journeySettings.category_ids as string[] | null;
  const categoryIds = storedCategoryIds && storedCategoryIds.length > 0 ? storedCategoryIds : null;
  let limit = journeySettings.question_limit as number | null;

  if (limit == null && journeySettings.creator_id) {
    const { loadEntitlement } = await import("./entitlement.functions");
    const entitlement = await loadEntitlement(journeySettings.creator_id as string);
    if (!categoryIds) limit = entitlement.questionLimit;
  } else if (limit == null && !categoryIds) {
    limit = 100;
  }

  let query = supabaseAdmin
    .from("questions")
    .select(
      "id, category_id, question, question_type, answer_options, weight, risk_level, order_index, branch_logic, applies_to",
    )
    .eq("active", true);

  if (journey.participant_type && journey.participant_type !== "any") {
    const expanded = expandRoleForFiltering(journey.participant_type);
    query = query.or(expanded.map((role) => `applies_to.cs.{${role}}`).join(","));
  }

  if (categoryIds) query = query.in("category_id", categoryIds);
  const { data: questions, error } = await query.order("order_index", {
    ascending: true,
  });
  if (error) throw new Error(error.message);

  const available = (questions ?? []) as unknown as AssessmentQuestion[];
  return limit != null && !categoryIds
    ? selectAssessmentQuestions(available, limit, journey.id)
    : available;
}

function computeScore(
  qType: string,
  options: AnswerOption[],
  weight: number,
  answer: unknown,
): number | null {
  if (answer == null) return null;
  const w = Number(weight) || 1;
  switch (qType) {
    case "single_choice":
    case "boolean":
    case "scenario": {
      const opt = options.find((o) => o.value === String(answer));
      return opt && typeof opt.score === "number" ? opt.score * w : 0;
    }
    case "multi_choice": {
      if (!Array.isArray(answer)) return 0;
      const picked = options.filter((o) => answer.includes(o.value));
      const sum = picked.reduce((s, o) => s + (o.score ?? 0), 0);
      return sum * w;
    }
    case "scale":
    case "slider": {
      const n = Number(answer);
      if (!Number.isFinite(n)) return 0;
      return n * w;
    }
    case "text":
    default:
      // open text: simple presence score (engagement)
      return typeof answer === "string" && answer.trim().length > 0 ? 1 * w : 0;
  }
}

export const getAssessment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CodeSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, journey, invite } = await loadInviteContext(data.code);
    const questions = await loadAssignedQuestions(supabaseAdmin, journey);
    const assignedIds = questions.map(({ id }) => id);

    const { data: categories, error: cErr } = await supabaseAdmin
      .from("question_categories")
      .select("id, name");
    if (cErr) throw new Error(cErr.message);

    const responses = assignedIds.length
      ? await supabaseAdmin
          .from("responses")
          .select("id, question_id, answer, score")
          .eq("journey_id", journey.id)
          .in("question_id", assignedIds)
      : { data: [], error: null };
    if (responses.error) throw new Error(responses.error.message);

    return {
      journey,
      invite,
      questions,
      categories: categories ?? [],
      responses: responses.data ?? [],
    };
  });

export const saveResponse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, journey } = await loadInviteContext(data.code);
    const assignedQuestions = await loadAssignedQuestions(supabaseAdmin, journey);
    const question = requireAssignedAssessmentQuestion(assignedQuestions, data.questionId);
    validateAssessmentAnswer(question, data.answer);

    const score = computeScore(
      question.question_type,
      (question.answer_options as AnswerOption[]) ?? [],
      Number(question.weight) || 1,
      data.answer,
    );

    // Upsert by (journey_id, question_id)
    const { data: existing } = await supabaseAdmin
      .from("responses")
      .select("id")
      .eq("journey_id", journey.id)
      .eq("question_id", data.questionId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("responses")
        .update({ answer: data.answer, score })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("responses").insert({
        journey_id: journey.id,
        question_id: data.questionId,
        answer: data.answer,
        score,
      });
      if (error) throw new Error(error.message);
    }

    // Move journey to in_progress on first save
    if (journey.status === "pending") {
      const { error } = await supabaseAdmin
        .from("journeys")
        .update({ status: "in_progress" })
        .eq("id", journey.id);
      if (error) throw new Error(error.message);
    }

    return { ok: true as const, score };
  });

export const completeAssessment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CompleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, journey, invite } = await loadInviteContext(data.code);
    const assignedQuestions = await loadAssignedQuestions(supabaseAdmin, journey);
    if (assignedQuestions.length === 0) {
      throw new Error("No questions are available for this assessment.");
    }
    const assignedIds = assignedQuestions.map(({ id }) => id);

    const { data: storedRows, error } = await supabaseAdmin
      .from("responses")
      .select(
        "question_id, answer, score, questions!inner(risk_level, weight, category_id, question_categories(name))",
      )
      .eq("journey_id", journey.id)
      .in("question_id", assignedIds);
    if (error) throw new Error(error.message);

    type ResponseScoreRow = {
      question_id: string;
      answer: unknown;
      score: number | string | null;
      questions: {
        question_categories: { name: string } | null;
      } | null;
    };
    const assignedResponses = (storedRows ?? []) as unknown as ResponseScoreRow[];
    const answers = Object.fromEntries(
      assignedResponses.map((row) => [row.question_id, row.answer]),
    );
    const visibleQuestions = visibleAssessmentQuestions(assignedQuestions, answers);
    const missingAnswers = visibleQuestions.filter(({ id }) => !hasAssessmentAnswer(answers[id]));
    if (missingAnswers.length > 0) {
      throw new Error("Answer every visible question and wait for it to save before submitting.");
    }

    const visibleIds = visibleQuestions.map(({ id }) => id);
    const visibleIdSet = new Set(visibleIds);
    const rows = assignedResponses.filter((row) => visibleIdSet.has(row.question_id));

    // Calculate maxima from this assessment's visible question set rather than
    // the global question bank.
    // Each "perfect" answer = 10, weighted. Red Flags weight encodes severity (low=1, med=2, high=4, crit=8).
    const RELEVANT = ["Green Flags", "BDSM Safety", "Red Flags"];
    const { data: maxRows, error: maxErr } = await supabaseAdmin
      .from("questions")
      .select("weight, question_categories!inner(name)")
      .in("id", visibleIds)
      .in("question_categories.name", RELEVANT);
    if (maxErr) throw new Error(maxErr.message);

    const maxes: Record<string, number> = { "Green Flags": 0, "BDSM Safety": 0, "Red Flags": 0 };
    for (const q of (maxRows ?? []) as Array<{
      weight: number | string;
      question_categories: { name: string } | null;
    }>) {
      const name = q.question_categories?.name;
      if (!name || !(name in maxes)) continue;
      maxes[name] += (Number(q.weight) || 1) * 10;
    }
    const greenMax = maxes["Green Flags"];
    const safetyMax = maxes["BDSM Safety"];
    const redMax = maxes["Red Flags"];

    let safetyRaw = 0,
      compat = 0,
      redRaw = 0,
      redLegacy = 0,
      greenRaw = 0,
      exp = 0;
    const visibleQuestionById = new Map(
      visibleQuestions.map((question) => [question.id, question]),
    );
    for (const row of rows) {
      const question = visibleQuestionById.get(row.question_id);
      if (!question) continue;
      validateAssessmentAnswer(question, row.answer);
      const s =
        Number(
          computeScore(
            question.question_type,
            (question.answer_options as AnswerOption[]) ?? [],
            Number(question.weight) || 1,
            row.answer,
          ),
        ) || 0;
      const cat = row.questions?.question_categories?.name ?? "";
      if (cat === "BDSM Safety" || cat === "Safety Practices") safetyRaw += s;
      if (cat === "Compatibility") compat += s;
      if (cat === "Experience") exp += s;
      if (cat === "Green Flags") greenRaw += s;
      if (cat === "Red Flags") {
        if (s > 0) redRaw += s;
        else if (s < 0) redLegacy += Math.abs(s);
      }
    }

    const green = greenMax > 0 ? Math.max(0, Math.min(100, (greenRaw / greenMax) * 100)) : 0;
    const safety = safetyMax > 0 ? Math.max(0, Math.min(100, (safetyRaw / safetyMax) * 100)) : 0;
    const red =
      redMax > 0 ? Math.max(0, Math.min(100, (redRaw / redMax) * 100)) : Math.min(100, redLegacy);

    const { error: resultError } = await supabaseAdmin.from("results").upsert(
      {
        journey_id: journey.id,
        safety_score: Math.round(safety),
        compatibility_score: Math.round(compat),
        red_flag_score: Math.round(red),
        green_flag_score: Math.round(green),
        experience_score: Math.round(exp),
        ai_summary: null,
      },
      { onConflict: "journey_id" },
    );
    if (resultError) throw new Error(resultError.message);

    const { error: journeyError } = await supabaseAdmin
      .from("journeys")
      .update({ status: "completed" })
      .eq("id", journey.id);
    if (journeyError) throw new Error(journeyError.message);

    const { error: inviteError } = await supabaseAdmin
      .from("invites")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (inviteError) throw new Error(inviteError.message);

    // Best-effort AI analysis. Processing is default-off until the owner has
    // approved the external processor and explicitly enables it.
    try {
      await runWhenAiAnalysisEnabled(async () => {
        const { runAnalysisInternal } = await import("./analysis.functions");
        return runAnalysisInternal(journey.id);
      });
    } catch (e) {
      console.error("AI analysis failed:", e);
    }

    // Best-effort completion notification to the journey owner.
    try {
      const { data: owner } = await supabaseAdmin
        .from("journeys")
        .select("creator_id, guest_phone, anonymous_no_contact")
        .eq("id", journey.id)
        .maybeSingle();

      // Guest journeys have no dashboard: mint a private shareable report link.
      let guestReportUrl: string | null = null;
      if (!owner?.creator_id && !owner?.anonymous_no_contact) {
        const { data: result } = await supabaseAdmin
          .from("results")
          .select("id, share_token")
          .eq("journey_id", journey.id)
          .maybeSingle();
        if (result) {
          let token = (result.share_token as string | null) ?? null;
          if (!token) {
            const bytes = new Uint8Array(18);
            crypto.getRandomValues(bytes);
            token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
          }
          await supabaseAdmin
            .from("results")
            .update({ share_enabled: true, share_token: token })
            .eq("id", result.id);
          guestReportUrl = `https://redflagdaddy.com/report/${token}`;
        }
      }

      const { sendClickatellSms } = await import("./phone-auth.server");

      // Text the guest their downloadable report link.
      const guestPhone = (owner?.guest_phone as string | null) ?? null;
      if (!owner?.creator_id && guestPhone && guestReportUrl) {
        try {
          await sendClickatellSms(
            guestPhone,
            `RedFlagDaddy: your assessment report is ready. View or download it here: ${guestReportUrl}`,
            "guest-report",
          );
        } catch (e) {
          console.error("Report SMS failed:", e);
        }
      }

      // Notify signed-in owners on their mobile that the report is ready.
      if (owner?.creator_id) {
        try {
          const { data: ownerUser } = await supabaseAdmin
            .from("users")
            .select("phone")
            .eq("id", owner.creator_id as string)
            .maybeSingle();
          const ownerPhone = (ownerUser?.phone as string | null) ?? null;
          if (ownerPhone) {
            await sendClickatellSms(
              ownerPhone,
              `RedFlagDaddy: your "${String(journey.title)}" report is ready. View it here: https://redflagdaddy.com/results/${journey.id}`,
              "owner-report",
            );
          }
        } catch (e) {
          console.error("Owner report SMS failed:", e);
        }
      }
    } catch (e) {
      console.error("Completion notification failed:", e);
    }

    return { ok: true as const, journeyId: journey.id };
  });
