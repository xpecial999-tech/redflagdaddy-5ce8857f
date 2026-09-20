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
import { expandRoleForFiltering, getBroadFamily } from "./roles";
import { throwPublicDataError } from "./public-data-error";
import { RateLimitError } from "./rate-limit.server";
import { CUSTOM_QUESTIONS_PER_CATEGORY } from "./assessment-questions";

const CodeSchema = z.object({ code: z.string().trim().min(4).max(64) });

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

async function consumeAssessmentRateLimits(
  rules: Parameters<(typeof import("./rate-limit.server"))["consumeRateLimits"]>[0],
) {
  const { consumeRateLimits } = await import("./rate-limit.server");
  try {
    await consumeRateLimits(rules);
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    console.error("[assessment] Rate-limit infrastructure failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

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

async function loadInviteContext(rawCode: string) {
  const code = normalizeCode(rawCode);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: journey, error: jErr } = await supabaseAdmin
    .from("journeys")
    .select("id, title, participant_type, status, invite_code")
    .eq("invite_code", code)
    .maybeSingle();
  if (jErr) throwPublicDataError(jErr, "load assessment journey");
  if (!journey) throw new Error("Invite not found.");

  const { data: invite, error: iErr } = await supabaseAdmin
    .from("invites")
    .select("id, expires_at, completed_at")
    .eq("journey_id", journey.id)
    .eq("code", code)
    .maybeSingle();
  if (iErr) throwPublicDataError(iErr, "load assessment invite");
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
  const questionSelect =
    "id, category_id, question, question_type, answer_options, weight, risk_level, order_index, branch_logic, applies_to, question_categories(name)";
  const settingsSelect =
    "id, participant_type, status, category_ids, question_limit, creator_id, pair_id, pair_side, assigned_question_ids";

  const { data: journeySettings, error: settingsError } = await supabaseAdmin
    .from("journeys")
    .select(settingsSelect)
    .eq("id", journey.id)
    .maybeSingle();
  if (settingsError) throwPublicDataError(settingsError, "load assessment settings");
  if (!journeySettings) throw new Error("Journey not found.");

  let sourceSettings = journeySettings;
  if (journeySettings.pair_id && journeySettings.pair_side === "owner") {
    const { data: pair, error: pairError } = await supabaseAdmin
      .from("journey_pairs")
      .select("partner_journey_id")
      .eq("id", journeySettings.pair_id)
      .maybeSingle();
    if (pairError) throwPublicDataError(pairError, "load paired assessment source");
    if (pair?.partner_journey_id) {
      const { data: partnerSettings, error: partnerError } = await supabaseAdmin
        .from("journeys")
        .select(settingsSelect)
        .eq("id", pair.partner_journey_id)
        .maybeSingle();
      if (partnerError) throwPublicDataError(partnerError, "load paired assessment settings");
      if (partnerSettings) sourceSettings = partnerSettings;
    }
  }

  const loadStoredQuestions = async (ids: string[]) => {
    const { data, error } = await supabaseAdmin
      .from("questions")
      .select(questionSelect)
      .in("id", ids);
    if (error) throwPublicDataError(error, "load assigned assessment questions");
    const position = new Map(ids.map((id, index) => [id, index]));
    return ((data ?? []) as unknown as AssessmentQuestion[]).sort(
      (left, right) => (position.get(left.id) ?? 0) - (position.get(right.id) ?? 0),
    );
  };

  let assignedIds = sourceSettings.assigned_question_ids as string[] | null;
  if ((!assignedIds || assignedIds.length === 0) && sourceSettings.status === "completed") {
    const { data: completedResponses, error: responseError } = await supabaseAdmin
      .from("responses")
      .select("question_id, questions!inner(order_index)")
      .eq("journey_id", sourceSettings.id);
    if (responseError) throwPublicDataError(responseError, "recover completed question set");
    assignedIds = (completedResponses ?? [])
      .sort((left, right) => {
        const leftQuestion = left.questions as unknown as { order_index?: unknown } | null;
        const rightQuestion = right.questions as unknown as { order_index?: unknown } | null;
        return Number(leftQuestion?.order_index ?? 0) - Number(rightQuestion?.order_index ?? 0);
      })
      .map(({ question_id }) => question_id);
  }

  if (assignedIds && assignedIds.length > 0) {
    if (
      journeySettings.id !== sourceSettings.id &&
      JSON.stringify(journeySettings.assigned_question_ids ?? []) !== JSON.stringify(assignedIds)
    ) {
      const { error: mirrorError } = await supabaseAdmin
        .from("journeys")
        .update({ assigned_question_ids: assignedIds })
        .eq("id", journeySettings.id);
      if (mirrorError) throwPublicDataError(mirrorError, "mirror paired question set");
    }
    return loadStoredQuestions(assignedIds);
  }

  const storedCategoryIds = sourceSettings.category_ids as string[] | null;
  const categoryIds = storedCategoryIds && storedCategoryIds.length > 0 ? storedCategoryIds : null;
  let limit = sourceSettings.question_limit as number | null;

  if (limit == null && sourceSettings.creator_id) {
    const { loadEntitlement } = await import("./entitlement.functions");
    const entitlement = await loadEntitlement(sourceSettings.creator_id as string);
    limit = categoryIds
      ? Math.min(entitlement.questionLimit, categoryIds.length * CUSTOM_QUESTIONS_PER_CATEGORY)
      : entitlement.questionLimit;
  } else if (limit == null && !categoryIds) {
    limit = 15;
  } else if (limit == null && categoryIds) {
    limit = categoryIds.length * CUSTOM_QUESTIONS_PER_CATEGORY;
  }

  let query = supabaseAdmin.from("questions").select(questionSelect).eq("active", true);

  if (sourceSettings.participant_type && sourceSettings.participant_type !== "any") {
    const expanded = expandRoleForFiltering(sourceSettings.participant_type);
    query = query.or(expanded.map((role) => `applies_to.cs.{${role}}`).join(","));
  }

  if (categoryIds) query = query.in("category_id", categoryIds);
  const { data: questions, error } = await query.order("order_index", {
    ascending: true,
  });
  if (error) throwPublicDataError(error, "load assessment questions");

  const broadFamily = getBroadFamily(sourceSettings.participant_type);
  const available = ((questions ?? []) as unknown as AssessmentQuestion[]).filter((question) => {
    const categoryName = question.question_categories?.name;
    if (broadFamily === "submissive" && categoryName === "Dominant Skills") return false;
    if (broadFamily === "Dominant" && categoryName === "Submissive Skills") return false;
    return true;
  });
  const selected =
    limit != null
      ? selectAssessmentQuestions(
          available,
          limit,
          sourceSettings.id,
          categoryIds ? "equal" : "weighted",
        )
      : available;
  const selectedIds = selected.map(({ id }) => id);
  const journeyIds = Array.from(new Set([sourceSettings.id, journeySettings.id]));
  const { error: assignmentError } = await supabaseAdmin
    .from("journeys")
    .update({ assigned_question_ids: selectedIds })
    .in("id", journeyIds);
  if (assignmentError) throwPublicDataError(assignmentError, "save assessment question set");
  return selected;
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

function optionScores(options: AnswerOption[]): number[] {
  return options.map((option) => Number(option.score)).filter(Number.isFinite);
}

function maxPositiveScore(question: AssessmentQuestion): number {
  const weight = Number(question.weight) || 1;
  const options = (question.answer_options as AnswerOption[]) ?? [];
  switch (question.question_type) {
    case "single_choice":
    case "boolean":
    case "scenario":
      return Math.max(0, ...optionScores(options)) * weight;
    case "multi_choice":
      return (
        options.reduce((sum, option) => sum + Math.max(0, Number(option.score) || 0), 0) * weight
      );
    case "scale":
      return 10 * weight;
    case "slider": {
      const rawCfg = Array.isArray(question.answer_options)
        ? (question.answer_options[0] as { max?: unknown } | undefined)
        : (question.answer_options as unknown as { max?: unknown } | undefined);
      const max = Number(rawCfg?.max);
      return (Number.isFinite(max) ? Math.max(0, max) : 100) * weight;
    }
    case "text":
      return 1 * weight;
    default:
      return 0;
  }
}

function maxRedFlagScore(question: AssessmentQuestion): number {
  const weight = Number(question.weight) || 1;
  const options = (question.answer_options as AnswerOption[]) ?? [];
  const scores = optionScores(options);
  switch (question.question_type) {
    case "single_choice":
    case "boolean":
    case "scenario":
      return Math.max(0, ...scores.map((score) => Math.abs(Math.min(0, score)))) * weight;
    case "multi_choice":
      return (
        options.reduce((sum, option) => sum + Math.abs(Math.min(0, Number(option.score) || 0)), 0) *
        weight
      );
    default:
      return 0;
  }
}

function scoreDimension(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function scoreCategory(
  name: string,
): "safety" | "compatibility" | "red" | "green" | "experience" | null {
  switch (name) {
    case "BDSM Safety":
    case "Safety Practices":
    case "Consent":
    case "Boundaries":
    case "Communication":
    case "Aftercare":
    case "Consent & Boundaries":
    case "Consent & Communication":
      return "safety";
    case "Compatibility":
    case "Accountability":
    case "Attachment Style":
    case "Conflict Resolution":
    case "Emotional Intelligence":
    case "Financial Responsibility":
    case "Power Exchange":
    case "Relationship Goals":
    case "Trust":
      return "compatibility";
    case "Red Flags":
      return "red";
    case "Green Flags":
      return "green";
    case "Experience":
    case "BDSM Experience":
    case "Community Involvement":
    case "Dominant Skills":
    case "Submissive Skills":
      return "experience";
    default:
      return null;
  }
}

export const getAssessment = createServerFn({ method: "POST" })
  .validator((d: unknown) => CodeSchema.parse(d))
  .handler(async ({ data }) => {
    const { callerIp } = await import("./rate-limit.server");
    await consumeAssessmentRateLimits([
      {
        action: "assessment_load_ip",
        value: callerIp(),
        windowSeconds: 60 * 60,
        maxEvents: 120,
      },
    ]);
    const { supabaseAdmin, journey, invite } = await loadInviteContext(data.code);
    const questions = await loadAssignedQuestions(supabaseAdmin, journey);
    const assignedIds = questions.map(({ id }) => id);

    const { data: categories, error: cErr } = await supabaseAdmin
      .from("question_categories")
      .select("id, name");
    if (cErr) throwPublicDataError(cErr, "load assessment categories");

    const responses = assignedIds.length
      ? await supabaseAdmin
          .from("responses")
          .select("id, question_id, answer, score")
          .eq("journey_id", journey.id)
          .in("question_id", assignedIds)
      : { data: [], error: null };
    if (responses.error) throwPublicDataError(responses.error, "load assessment responses");

    return {
      journey,
      invite,
      questions,
      categories: categories ?? [],
      responses: responses.data ?? [],
    };
  });

export const saveResponse = createServerFn({ method: "POST" })
  .validator((d: unknown) => SaveSchema.parse(d))
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
      if (error) throwPublicDataError(error, "update assessment response");
    } else {
      const { error } = await supabaseAdmin.from("responses").insert({
        journey_id: journey.id,
        question_id: data.questionId,
        answer: data.answer,
        score,
      });
      if (error) throwPublicDataError(error, "create assessment response");
    }

    // Move journey to in_progress on first save
    if (journey.status === "pending") {
      const { error } = await supabaseAdmin
        .from("journeys")
        .update({ status: "in_progress" })
        .eq("id", journey.id);
      if (error) throwPublicDataError(error, "start assessment journey");
    }

    return { ok: true as const, score };
  });

export const completeAssessment = createServerFn({ method: "POST" })
  .validator((d: unknown) => CompleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { callerIp } = await import("./rate-limit.server");
    await consumeAssessmentRateLimits([
      {
        action: "assessment_complete_ip",
        value: callerIp(),
        windowSeconds: 60 * 60,
        maxEvents: 20,
      },
    ]);
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
    if (error) throwPublicDataError(error, "load assessment completion responses");

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

    const maxes: Record<"safety" | "compatibility" | "red" | "green" | "experience", number> = {
      safety: 0,
      compatibility: 0,
      red: 0,
      green: 0,
      experience: 0,
    };
    const visibleQuestionById = new Map(
      visibleQuestions.map((question) => [question.id, question]),
    );
    for (const question of visibleQuestions) {
      const cat = scoreCategory(question.question_categories?.name ?? "");
      if (!cat) continue;
      maxes[cat] += maxPositiveScore(question);
      maxes.red += maxRedFlagScore(question);
    }

    let safetyRaw = 0,
      compatibilityRaw = 0,
      redRaw = 0,
      greenRaw = 0,
      experienceRaw = 0;
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
      switch (scoreCategory(cat)) {
        case "safety":
          safetyRaw += Math.max(0, s);
          if (s < 0) redRaw += Math.abs(s);
          break;
        case "compatibility":
          compatibilityRaw += Math.max(0, s);
          if (s < 0) redRaw += Math.abs(s);
          break;
        case "experience":
          experienceRaw += Math.max(0, s);
          if (s < 0) redRaw += Math.abs(s);
          break;
        case "green":
          greenRaw += Math.max(0, s);
          if (s < 0) redRaw += Math.abs(s);
          break;
        case "red":
          if (s < 0) redRaw += Math.abs(s);
          break;
      }
    }

    const green = scoreDimension(greenRaw, maxes.green);
    const safety = scoreDimension(safetyRaw, maxes.safety);
    const compatibility = scoreDimension(compatibilityRaw, maxes.compatibility);
    const experience = scoreDimension(experienceRaw, maxes.experience);
    const red = scoreDimension(redRaw, maxes.red);

    const { error: resultError } = await supabaseAdmin.from("results").upsert(
      {
        journey_id: journey.id,
        safety_score: Math.round(safety),
        compatibility_score: Math.round(compatibility),
        red_flag_score: Math.round(red),
        green_flag_score: Math.round(green),
        experience_score: Math.round(experience),
        ai_summary: null,
      },
      { onConflict: "journey_id" },
    );
    if (resultError) throwPublicDataError(resultError, "save assessment result");

    try {
      const { buildDeterministicAnalysisInternal } = await import("./analysis.functions");
      await buildDeterministicAnalysisInternal(journey.id);
    } catch (e) {
      console.error("Deterministic analysis failed:", e);
    }

    try {
      const { data: pair } = await (supabaseAdmin as any)
        .from("journey_pairs")
        .select("id")
        .or(`owner_journey_id.eq.${journey.id},partner_journey_id.eq.${journey.id}`)
        .maybeSingle();
      if (pair?.id) {
        const { buildPairAnalysisInternal } = await import("./analysis.functions");
        await buildPairAnalysisInternal(pair.id);
      }
    } catch (e) {
      console.error("Pair comparison failed:", e);
    }

    const { error: journeyError } = await supabaseAdmin
      .from("journeys")
      .update({ status: "completed" })
      .eq("id", journey.id);
    if (journeyError) throwPublicDataError(journeyError, "complete assessment journey");

    const completedAt = new Date().toISOString();
    const { data: completedInvite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .update({ completed_at: completedAt })
      .eq("id", invite.id)
      .is("completed_at", null)
      .select("id")
      .maybeSingle();
    if (inviteError) throwPublicDataError(inviteError, "complete assessment invite");
    if (!completedInvite) throw new Error("This invite has already been completed.");

    // Best-effort AI polish. A deterministic structured report is already saved
    // above, so external processing must never block report availability.
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
          .select("id, share_token, share_enabled")
          .eq("journey_id", journey.id)
          .maybeSingle();
        if (result) {
          let token = (result.share_token as string | null) ?? null;
          if (!token || !result.share_enabled) {
            const bytes = new Uint8Array(18);
            crypto.getRandomValues(bytes);
            token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
          }
          const { error: shareError } = await supabaseAdmin
            .from("results")
            .update({ share_enabled: true, share_token: token })
            .eq("id", result.id);
          if (shareError) {
            console.error("[assessment-complete] Guest report link update failed", {
              code: shareError.code,
            });
          } else {
            const { publicSiteOrigin } = await import("./site-url.server");
            guestReportUrl = `${publicSiteOrigin()}/report/${encodeURIComponent(token)}`;
          }
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
            const { publicSiteOrigin } = await import("./site-url.server");
            await sendClickatellSms(
              ownerPhone,
              `RedFlagDaddy: your report is ready. View it here: ${publicSiteOrigin()}/results/${encodeURIComponent(journey.id)}`,
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
