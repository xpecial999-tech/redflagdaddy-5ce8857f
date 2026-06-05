import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const IdSchema = z.object({ journeyId: z.string().uuid() });

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

async function buildAnswerDigest(supabaseAdmin: any, journeyId: string) {
  const { data: rows } = await supabaseAdmin
    .from("responses")
    .select("answer, score, questions!inner(question, risk_level, question_categories!inner(name))")
    .eq("journey_id", journeyId);

  const byCat: Record<string, { total: number; topRisk: Array<{ q: string; a: unknown; risk: string; score: number }> }> = {};
  for (const r of (rows ?? []) as any[]) {
    const cat = r.questions?.question_categories?.name ?? "Other";
    if (!byCat[cat]) byCat[cat] = { total: 0, topRisk: [] };
    byCat[cat].total += 1;
    const score = Number(r.score) || 0;
    const risk = r.questions?.risk_level ?? "low";
    // Track answers that contributed risk (positive score for red flags, or critical/high level)
    if (Math.abs(score) >= 3 || risk === "critical" || risk === "high") {
      byCat[cat].topRisk.push({ q: r.questions.question, a: r.answer, risk, score });
    }
  }
  // Truncate per category to keep prompt size bounded
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

export const runAnalysis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: result, error: rErr } = await supabaseAdmin
      .from("results")
      .select("*")
      .eq("journey_id", data.journeyId)
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

    const digest = await buildAnswerDigest(supabaseAdmin, data.journeyId);
    const analysis = await callGateway(scores, digest);

    await supabaseAdmin
      .from("results")
      .update({ ai_summary: JSON.stringify(analysis) })
      .eq("journey_id", data.journeyId);

    return { ok: true as const, analysis };
  });

export const getResults = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: journey } = await supabaseAdmin
      .from("journeys")
      .select("id, title, participant_type, status")
      .eq("id", data.journeyId)
      .maybeSingle();
    if (!journey) throw new Error("Journey not found.");

    const { data: result } = await supabaseAdmin
      .from("results")
      .select("*")
      .eq("journey_id", data.journeyId)
      .maybeSingle();

    let analysis: AnalysisPayload | null = null;
    if (result?.ai_summary) {
      try { analysis = JSON.parse(result.ai_summary as string); } catch { analysis = null; }
    }
    return { journey, result: result ?? null, analysis };
  });
