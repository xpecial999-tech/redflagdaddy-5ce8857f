import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CodeSchema = z.object({ code: z.string().trim().min(4).max(64) });

const SaveSchema = z.object({
  code: z.string().trim().min(4).max(64),
  questionId: z.string().uuid(),
  answer: z.any(),
});

const CompleteSchema = z.object({ code: z.string().trim().min(4).max(64) });

type AnswerOption = { label: string; value: string; score?: number };

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

function computeScore(qType: string, options: AnswerOption[], weight: number, answer: unknown): number | null {
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

    const { data: questions, error: qErr } = await supabaseAdmin
      .from("questions")
      .select("id, category_id, question, question_type, answer_options, weight, risk_level, order_index, branch_logic")
      .eq("active", true)
      .order("order_index", { ascending: true });
    if (qErr) throw new Error(qErr.message);

    const { data: categories, error: cErr } = await supabaseAdmin
      .from("question_categories")
      .select("id, name");
    if (cErr) throw new Error(cErr.message);

    const { data: responses, error: rErr } = await supabaseAdmin
      .from("responses")
      .select("id, question_id, answer, score")
      .eq("journey_id", journey.id);
    if (rErr) throw new Error(rErr.message);

    return {
      journey,
      invite,
      questions: questions ?? [],
      categories: categories ?? [],
      responses: responses ?? [],
    };
  });

export const saveResponse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, journey } = await loadInviteContext(data.code);

    const { data: question, error: qErr } = await supabaseAdmin
      .from("questions")
      .select("question_type, answer_options, weight")
      .eq("id", data.questionId)
      .maybeSingle();
    if (qErr) throw new Error(qErr.message);
    if (!question) throw new Error("Question not found.");

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
      await supabaseAdmin.from("journeys").update({ status: "in_progress" }).eq("id", journey.id);
    }

    return { ok: true as const, score };
  });

export const completeAssessment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CompleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, journey, invite } = await loadInviteContext(data.code);

    // Aggregate scores by category
    const { data: rows, error } = await supabaseAdmin
      .from("responses")
      .select("score, questions!inner(risk_level, weight, category_id, question_categories(name))")
      .eq("journey_id", journey.id);
    if (error) throw new Error(error.message);

    // Max-possible per normalized category (Always/Yes path = score 10).
    const { data: greenQs } = await supabaseAdmin
      .from("questions")
      .select("weight, question_categories!inner(name)")
      .eq("active", true)
      .eq("question_categories.name", "Green Flags");
    const greenMax = ((greenQs ?? []) as any[]).reduce(
      (s, q) => s + (Number(q.weight) || 1) * 10,
      0,
    );

    const { data: safetyQs } = await supabaseAdmin
      .from("questions")
      .select("weight, question_categories!inner(name)")
      .eq("active", true)
      .eq("question_categories.name", "BDSM Safety");
    const safetyMax = ((safetyQs ?? []) as any[]).reduce(
      (s, q) => s + (Number(q.weight) || 1) * 10,
      0,
    );

    // Red Flags: weight encodes the risk-level multiplier
    // (low=1, medium=2, high=4, critical=8) so Critical answers dominate the score.
    const { data: redQs } = await supabaseAdmin
      .from("questions")
      .select("weight, question_categories!inner(name)")
      .eq("active", true)
      .eq("question_categories.name", "Red Flags");
    const redMax = ((redQs ?? []) as any[]).reduce(
      (s, q) => s + (Number(q.weight) || 1) * 10,
      0,
    );

    let safetyRaw = 0, compat = 0, redRaw = 0, redLegacy = 0, greenRaw = 0, exp = 0;
    for (const row of (rows ?? []) as any[]) {
      const s = Number(row.score) || 0;
      const cat = row.questions?.question_categories?.name ?? "";
      if (cat === "BDSM Safety" || cat === "Safety Practices") safetyRaw += s;
      if (cat === "Compatibility") compat += s;
      if (cat === "Experience") exp += s;
      if (cat === "Green Flags") greenRaw += s;
      if (cat === "Red Flags") {
        if (s > 0) redRaw += s;
        else if (s < 0) redLegacy += Math.abs(s); // backward-compat for older negative-scored items
      }
    }

    const green = greenMax > 0 ? Math.max(0, Math.min(100, (greenRaw / greenMax) * 100)) : 0;
    // Safety Score: unsafe answers carry negative weights → can drag score below 0; floor at 0.
    const safety = safetyMax > 0 ? Math.max(0, Math.min(100, (safetyRaw / safetyMax) * 100)) : 0;
    // Red Flag Score /100. Higher = more red flags. Critical-weighted (8×) items push the
    // score sharply upward even from a small number of "Often"/"Always" answers.
    const red = redMax > 0
      ? Math.max(0, Math.min(100, (redRaw / redMax) * 100))
      : Math.min(100, redLegacy);

    await supabaseAdmin
      .from("results")
      .upsert(
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

    await supabaseAdmin.from("invites").update({ completed_at: new Date().toISOString() }).eq("id", invite.id);
    await supabaseAdmin.from("journeys").update({ status: "completed" }).eq("id", journey.id);

    // Best-effort AI analysis. Don't block completion on AI errors.
    try {
      const { runAnalysis } = await import("./analysis.functions");
      await runAnalysis({ data: { journeyId: journey.id } });
    } catch (e) {
      console.error("AI analysis failed:", e);
    }

    return { ok: true as const, journeyId: journey.id };
  });
