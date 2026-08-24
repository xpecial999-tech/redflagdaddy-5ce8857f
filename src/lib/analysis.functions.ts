import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAiAnalysisEnabled } from "@/lib/ai-analysis-config";
import { z } from "zod";

const IdSchema = z.object({ journeyId: z.string().uuid() });

type AnswerDigestRow = {
  answer: unknown;
  score: number | null;
  questions: {
    question: string;
    risk_level: string;
    question_categories: { name: string } | null;
  } | null;
};

export type AnalysisSection = {
  title: string;
  summary: string;
  strengths: string[];
  risks: string[];
  missing_information: string[];
  concerns: string[];
};

export type AnalysisPayload = {
  safety: AnalysisSection;
  compatibility: AnalysisSection;
  red_flags: AnalysisSection;
  green_flags: AnalysisSection;
  communication: AnalysisSection;
  consent: AnalysisSection;
  dynamic_readiness: {
    score: number; // 0-100
    label: "Not ready" | "Early stage" | "Developing" | "Ready" | "Strongly ready";
    rationale: string;
    strengths: string[];
    risks: string[];
    missing_information: string[];
    concerns: string[];
  };
  overall_note: string;
  generated_at: string;
};

const SYSTEM_PROMPT = `You are a professional assessment analyst writing summaries of a structured BDSM and relationship compatibility questionnaire. Your audience is the assessment creator and their prospective partner.

Rules:
- Use neutral, professional, non-clinical language.
- Do NOT diagnose, suggest, or label any mental health condition, personality disorder, or psychiatric diagnosis.
- Do NOT provide therapy, legal, or medical advice.
- Acknowledge uncertainty explicitly when data is thin.
- When something is unsafe (e.g. ignored safewords, removed consent), name it directly and clearly as a safety concern.
- Avoid moralizing. Avoid romantic projection. Avoid speculation about motives.
- Return only the structured analysis tool call. No prose outside the tool call.
- Each list (strengths, risks, missing_information, concerns) should contain 0-5 short, specific bullet items grounded in the provided scores and answer summary.
- The Dynamic Readiness Score (0-100) reflects readiness to enter or deepen a power-exchange dynamic, weighted by safety + consent + low red flags + sufficient communication signals.`;

type ScoreBundle = {
  safety_score: number;
  compatibility_score: number;
  red_flag_score: number;
  green_flag_score: number;
  experience_score: number;
};

async function buildAnswerDigest(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  journeyId: string,
) {
  const { data: rows } = await supabaseAdmin
    .from("responses")
    .select("answer, score, questions!inner(question, risk_level, question_categories!inner(name))")
    .eq("journey_id", journeyId);

  const byCat: Record<string, { total: number; topRisk: Array<{ q: string; a: unknown; risk: string; score: number }> }> = {};
  for (const r of ((rows ?? []) as unknown as AnswerDigestRow[])) {
    const cat = r.questions?.question_categories?.name ?? "Other";
    if (!byCat[cat]) byCat[cat] = { total: 0, topRisk: [] };
    byCat[cat].total += 1;
    const score = Number(r.score) || 0;
    const risk = r.questions?.risk_level ?? "low";
    if (Math.abs(score) >= 3 || risk === "critical" || risk === "high") {
      const rawA = r.answer;
      const safeA =
        typeof rawA === "string"
          ? rawA.slice(0, 500)
          : Array.isArray(rawA)
            ? rawA.slice(0, 20).map((v) => (typeof v === "string" ? v.slice(0, 200) : v))
            : rawA;
      byCat[cat].topRisk.push({
        q: (r.questions?.question ?? "").slice(0, 300),
        a: safeA,
        risk,
        score,
      });
    }
  }
  for (const k of Object.keys(byCat)) {
    byCat[k].topRisk.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    byCat[k].topRisk = byCat[k].topRisk.slice(0, 6);
  }
  return byCat;
}

async function callGateway(scores: ScoreBundle, digest: unknown): Promise<AnalysisPayload> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const sectionSchema = {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      missing_information: { type: "array", items: { type: "string" } },
      concerns: { type: "array", items: { type: "string" } },
    },
    required: ["title", "summary", "strengths", "risks", "missing_information", "concerns"],
    additionalProperties: false,
  };

  const tool = {
    type: "function",
    function: {
      name: "submit_analysis",
      description: "Submit the structured assessment analysis.",
      parameters: {
        type: "object",
        properties: {
          safety: sectionSchema,
          compatibility: sectionSchema,
          red_flags: sectionSchema,
          green_flags: sectionSchema,
          communication: sectionSchema,
          consent: sectionSchema,
          dynamic_readiness: {
            type: "object",
            properties: {
              score: { type: "number" },
              label: { type: "string", enum: ["Not ready", "Early stage", "Developing", "Ready", "Strongly ready"] },
              rationale: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              missing_information: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
            },
            required: ["score", "label", "rationale", "strengths", "risks", "missing_information", "concerns"],
            additionalProperties: false,
          },
          overall_note: { type: "string" },
        },
        required: [
          "safety", "compatibility", "red_flags", "green_flags",
          "communication", "consent", "dynamic_readiness", "overall_note",
        ],
        additionalProperties: false,
      },
    },
  };

  const userPayload = {
    scores,
    notes:
      "Scores are 0-100. Higher safety/green/compatibility/experience = better. Higher red_flag_score = more red flags detected; treat 30+ as elevated, 60+ as serious.",
    answer_digest: digest,
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "submit_analysis" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) throw new Error("Rate limits exceeded, please try again later.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
    throw new Error(`AI gateway error (${resp.status}): ${text.slice(0, 200)}`);
  }

  const json = await resp.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("AI did not return a structured analysis.");
  const parsed = JSON.parse(call.function.arguments);
  return { ...parsed, generated_at: new Date().toISOString() };
}

/**
 * Internal helper — not exposed as RPC. Use from trusted server contexts only
 * (e.g. completeAssessment which validates the invite code).
 */
export async function runAnalysisInternal(journeyId: string) {
  if (!isAiAnalysisEnabled()) {
    throw new Error("AI analysis is not enabled.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: result, error: rErr } = await supabaseAdmin
    .from("results")
    .select("*")
    .eq("journey_id", journeyId)
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!result) throw new Error("No results yet for this journey.");

  const scores: ScoreBundle = {
    safety_score: Number(result.safety_score) || 0,
    compatibility_score: Number(result.compatibility_score) || 0,
    red_flag_score: Number(result.red_flag_score) || 0,
    green_flag_score: Number(result.green_flag_score) || 0,
    experience_score: Number(result.experience_score) || 0,
  };

  const digest = await buildAnswerDigest(supabaseAdmin, journeyId);
  const analysis = await callGateway(scores, digest);

  await supabaseAdmin
    .from("results")
    .update({ ai_summary: JSON.stringify(analysis) })
    .eq("journey_id", journeyId);

  return { ok: true as const, analysis };
}

async function assertJourneyOwner(userId: string, journeyId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: journey, error } = await supabaseAdmin
    .from("journeys")
    .select("id, title, participant_type, status, creator_id")
    .eq("id", journeyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!journey) throw new Error("Journey not found.");

  if (journey.creator_id !== userId) {
    // Allow admins to view
    const { data: admin } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!admin) throw new Error("Not authorized.");
  }
  return { supabaseAdmin, journey };
}

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertJourneyOwner(context.userId, data.journeyId);
    return runAnalysisInternal(data.journeyId);
  });

export const getResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, journey } = await assertJourneyOwner(context.userId, data.journeyId);

    const { data: result } = await supabaseAdmin
      .from("results")
      .select("*")
      .eq("journey_id", data.journeyId)
      .maybeSingle();

    let analysis: AnalysisPayload | null = null;
    if (result?.ai_summary) {
      try { analysis = JSON.parse(result.ai_summary as string); } catch { analysis = null; }
    }
    return {
      journey: {
        id: journey.id,
        title: journey.title,
        participant_type: journey.participant_type,
        status: journey.status,
      },
      result: result ?? null,
      analysis,
      analysisAvailable: isAiAnalysisEnabled(),
      share: {
        enabled: Boolean(result?.share_enabled),
        token: (result?.share_token as string | null) ?? null,
      },
    };
  });

const ShareSchema = z.object({
  journeyId: z.string().uuid(),
  enabled: z.boolean(),
});

export const toggleShareReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ShareSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertJourneyOwner(context.userId, data.journeyId);

    const { data: existing } = await supabaseAdmin
      .from("results")
      .select("id, share_token")
      .eq("journey_id", data.journeyId)
      .maybeSingle();
    if (!existing) throw new Error("No report exists for this journey yet.");

    let token = existing.share_token as string | null;
    if (data.enabled && !token) {
      const bytes = new Uint8Array(18);
      crypto.getRandomValues(bytes);
      token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    const { error } = await supabaseAdmin
      .from("results")
      .update({ share_enabled: data.enabled, share_token: token })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);

    return { enabled: data.enabled, token: data.enabled ? token : null };
  });

const TokenSchema = z.object({ token: z.string().trim().min(8).max(128) });

export const getSharedReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: result, error } = await supabaseAdmin
      .from("results")
      .select("*, journeys!inner(title, participant_type)")
      .eq("share_token", data.token)
      .eq("share_enabled", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!result) throw new Error("This shared report is unavailable.");

    let analysis: AnalysisPayload | null = null;
    if (result.ai_summary) {
      try { analysis = JSON.parse(result.ai_summary as string); } catch { analysis = null; }
    }

    const j = (result as { journeys: { title: string; participant_type: string } }).journeys;
    return {
      journey: { title: j.title, participant_type: j.participant_type },
      result: {
        safety_score: result.safety_score,
        compatibility_score: result.compatibility_score,
        red_flag_score: result.red_flag_score,
        green_flag_score: result.green_flag_score,
        experience_score: result.experience_score,
      },
      analysis,
    };
  });
