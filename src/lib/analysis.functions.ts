import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAiAnalysisEnabled } from "@/lib/ai-analysis-config";
import { callStructuredAi, type StructuredAiTool } from "@/lib/ai-provider";
import { buildDeterministicAnalysis } from "@/lib/deterministic-analysis";
import {
  buildPairAnalysis,
  type PairAnalysisPayload,
  type PairSideSummary,
} from "@/lib/pair-analysis";
import { z } from "zod";

const IdSchema = z.object({ journeyId: z.string().uuid() });

type AnswerDigestRow = {
  answer: unknown;
  score: number | null;
  questions: {
    question: string;
    answer_options: unknown;
    risk_level: string;
    question_categories: { name: string } | null;
  } | null;
};

type DigestAnswerOption = { label?: unknown; value?: unknown };

export function formatDigestAnswer(answer: unknown, answerOptions: unknown): unknown {
  const options = Array.isArray(answerOptions) ? (answerOptions as DigestAnswerOption[]) : [];
  const labelFor = (value: unknown) => {
    const match = options.find((option) => option.value === value);
    return typeof match?.label === "string" && match.label.trim() ? match.label.trim() : value;
  };

  if (Array.isArray(answer)) return answer.map(labelFor);
  return labelFor(answer);
}

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

const AnalysisSectionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  missing_information: z.array(z.string()),
  concerns: z.array(z.string()),
});

const AnalysisPayloadSchema = z.object({
  safety: AnalysisSectionSchema,
  compatibility: AnalysisSectionSchema,
  red_flags: AnalysisSectionSchema,
  green_flags: AnalysisSectionSchema,
  communication: AnalysisSectionSchema,
  consent: AnalysisSectionSchema,
  dynamic_readiness: z.object({
    score: z.number(),
    label: z.enum(["Not ready", "Early stage", "Developing", "Ready", "Strongly ready"]),
    rationale: z.string(),
    strengths: z.array(z.string()),
    risks: z.array(z.string()),
    missing_information: z.array(z.string()),
    concerns: z.array(z.string()),
  }),
  overall_note: z.string(),
  generated_at: z.string(),
});

export function parseAnalysisPayload(value: unknown): AnalysisPayload | null {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  const parsed = AnalysisPayloadSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const PairAnalysisSchema = z.object({
  kind: z.literal("pair_comparison"),
  owner: z.object({
    journeyId: z.string(),
    title: z.string(),
    role: z.string(),
    scores: z.object({
      safety: z.number(),
      compatibility: z.number(),
      red: z.number(),
      green: z.number(),
      experience: z.number(),
    }),
  }),
  partner: z.object({
    journeyId: z.string(),
    title: z.string(),
    role: z.string(),
    scores: z.object({
      safety: z.number(),
      compatibility: z.number(),
      red: z.number(),
      green: z.number(),
      experience: z.number(),
    }),
  }),
  overall: z.object({
    score: z.number(),
    label: z.enum(["Strong alignment", "Workable alignment", "Needs discussion", "Slow down"]),
    summary: z.string(),
  }),
  score_deltas: z.object({
    safety: z.number(),
    compatibility: z.number(),
    red: z.number(),
    green: z.number(),
    experience: z.number(),
  }),
  shared_strengths: z.array(z.string()),
  discussion_points: z.array(z.string()),
  watchouts: z.array(z.string()),
  question_insights: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      owner: z.string(),
      partner: z.string(),
      prompt: z.string(),
      severity: z.enum(["strength", "watch", "concern"]),
      dimension: z
        .enum([
          "safety",
          "consent",
          "communication",
          "compatibility",
          "green_flags",
          "red_flags",
          "experience",
        ])
        .optional(),
    }),
  ),
  next_steps: z.array(z.string()),
  generated_at: z.string(),
});

export function parsePairAnalysisPayload(value: unknown): PairAnalysisPayload | null {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  const parsed = PairAnalysisSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

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

export async function buildAnswerDigest(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  journeyId: string,
) {
  const { data: rows } = await supabaseAdmin
    .from("responses")
    .select(
      "answer, score, questions!inner(question, answer_options, risk_level, question_categories!inner(name))",
    )
    .eq("journey_id", journeyId);

  const byCat: Record<
    string,
    { total: number; topRisk: Array<{ q: string; a: unknown; risk: string; score: number }> }
  > = {};
  for (const r of (rows ?? []) as unknown as AnswerDigestRow[]) {
    const cat = r.questions?.question_categories?.name ?? "Other";
    if (!byCat[cat]) byCat[cat] = { total: 0, topRisk: [] };
    byCat[cat].total += 1;
    const score = Number(r.score) || 0;
    const risk = r.questions?.risk_level ?? "low";
    if (Math.abs(score) >= 3 || risk === "critical" || risk === "high") {
      const rawA = formatDigestAnswer(r.answer, r.questions?.answer_options);
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

async function loadScoreBundle(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  journeyId: string,
): Promise<ScoreBundle> {
  const { data: result, error: rErr } = await supabaseAdmin
    .from("results")
    .select("*")
    .eq("journey_id", journeyId)
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!result) throw new Error("No results yet for this journey.");

  return {
    safety_score: Number(result.safety_score) || 0,
    compatibility_score: Number(result.compatibility_score) || 0,
    red_flag_score: Number(result.red_flag_score) || 0,
    green_flag_score: Number(result.green_flag_score) || 0,
    experience_score: Number(result.experience_score) || 0,
  };
}

export async function buildDeterministicAnalysisInternal(journeyId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const scores = await loadScoreBundle(supabaseAdmin, journeyId);
  const digest = await buildAnswerDigest(supabaseAdmin, journeyId);
  const analysis = buildDeterministicAnalysis(scores, digest);

  await supabaseAdmin
    .from("results")
    .update({ ai_summary: JSON.stringify(analysis) })
    .eq("journey_id", journeyId);

  return { ok: true as const, analysis };
}

async function loadPairSide(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  journeyId: string,
): Promise<PairSideSummary | null> {
  const { data: journey, error: journeyError } = await supabaseAdmin
    .from("journeys")
    .select("id, title, participant_type")
    .eq("id", journeyId)
    .maybeSingle();
  if (journeyError) throw new Error(journeyError.message);
  if (!journey) return null;

  const scores = await loadScoreBundle(supabaseAdmin, journeyId);
  return {
    journeyId: journey.id,
    title: journey.title,
    role: journey.participant_type,
    scores: {
      safety: scores.safety_score,
      compatibility: scores.compatibility_score,
      red: scores.red_flag_score,
      green: scores.green_flag_score,
      experience: scores.experience_score,
    },
  };
}

export async function buildPairAnalysisInternal(pairId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: pair, error: pairError } = await (supabaseAdmin as any)
    .from("journey_pairs")
    .select("id, owner_journey_id, partner_journey_id")
    .eq("id", pairId)
    .maybeSingle();
  if (pairError) throw new Error(pairError.message);
  if (!pair) throw new Error("Pair not found.");

  const [owner, partner] = await Promise.all([
    loadPairSide(supabaseAdmin, pair.owner_journey_id),
    loadPairSide(supabaseAdmin, pair.partner_journey_id),
  ]);
  if (!owner || !partner) throw new Error("Pair journeys are incomplete.");

  const { data: responseRows, error: responseError } = await supabaseAdmin
    .from("responses")
    .select(
      "journey_id, question_id, answer, score, questions!inner(question, risk_level, question_categories!inner(name))",
    )
    .in("journey_id", [owner.journeyId, partner.journeyId]);
  if (responseError) throw new Error(responseError.message);

  const byQuestion = new Map<
    string,
    {
      question: string;
      category: string;
      risk: string;
      ownerAnswer?: unknown;
      partnerAnswer?: unknown;
      ownerScore?: number;
      partnerScore?: number;
    }
  >();

  for (const row of (responseRows ?? []) as Array<{
    journey_id: string;
    question_id: string;
    answer: unknown;
    score: number | null;
    questions: {
      question: string;
      risk_level: string;
      question_categories: { name: string } | null;
    } | null;
  }>) {
    const existing = byQuestion.get(row.question_id) ?? {
      question: row.questions?.question ?? "Assessment question",
      category: row.questions?.question_categories?.name ?? "Other",
      risk: row.questions?.risk_level ?? "low",
    };
    if (row.journey_id === owner.journeyId) {
      existing.ownerAnswer = row.answer;
      existing.ownerScore = Number(row.score) || 0;
    } else if (row.journey_id === partner.journeyId) {
      existing.partnerAnswer = row.answer;
      existing.partnerScore = Number(row.score) || 0;
    }
    byQuestion.set(row.question_id, existing);
  }

  const matches = Array.from(byQuestion.values())
    .filter((item) => item.ownerAnswer !== undefined && item.partnerAnswer !== undefined)
    .map((item) => ({
      question: item.question,
      category: item.category,
      risk: item.risk,
      ownerAnswer: item.ownerAnswer,
      partnerAnswer: item.partnerAnswer,
      ownerScore: item.ownerScore ?? 0,
      partnerScore: item.partnerScore ?? 0,
    }));

  const analysis = buildPairAnalysis({ owner, partner, matches });
  await (supabaseAdmin as any)
    .from("journey_pairs")
    .update({
      comparison_summary: analysis,
      both_completed_at: new Date().toISOString(),
    })
    .eq("id", pair.id);

  return { ok: true as const, analysis };
}

async function callGateway(scores: ScoreBundle, digest: unknown): Promise<AnalysisPayload> {
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

  const tool: StructuredAiTool = {
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
              label: {
                type: "string",
                enum: ["Not ready", "Early stage", "Developing", "Ready", "Strongly ready"],
              },
              rationale: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              missing_information: { type: "array", items: { type: "string" } },
              concerns: { type: "array", items: { type: "string" } },
            },
            required: [
              "score",
              "label",
              "rationale",
              "strengths",
              "risks",
              "missing_information",
              "concerns",
            ],
            additionalProperties: false,
          },
          overall_note: { type: "string" },
        },
        required: [
          "safety",
          "compatibility",
          "red_flags",
          "green_flags",
          "communication",
          "consent",
          "dynamic_readiness",
          "overall_note",
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

  const parsed = await callStructuredAi<Omit<AnalysisPayload, "generated_at">>({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    tools: [tool],
    toolName: "submit_analysis",
    maxTokens: 3500,
  });
  const analysis = { ...parsed, generated_at: new Date().toISOString() };
  const valid = parseAnalysisPayload(analysis);
  if (!valid) throw new Error("AI returned an incomplete analysis.");
  return valid;
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

  const scores = await loadScoreBundle(supabaseAdmin, journeyId);
  const digest = await buildAnswerDigest(supabaseAdmin, journeyId);
  const analysis = await callGateway(scores, digest);

  await supabaseAdmin
    .from("results")
    .update({ ai_summary: JSON.stringify(analysis) })
    .eq("journey_id", journeyId);

  return { ok: true as const, analysis };
}

async function assertJourneyAccess(
  userId: string,
  journeyId: string,
  options?: { ownerOnly?: boolean },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: journey, error } = await supabaseAdmin
    .from("journeys")
    .select(
      "id, title, participant_type, status, creator_id, participant_user_id, pair_id, pair_side",
    )
    .eq("id", journeyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!journey) throw new Error("Journey not found.");

  const hasDirectAccess =
    journey.creator_id === userId ||
    (!options?.ownerOnly && journey.participant_user_id === userId);
  if (!hasDirectAccess) {
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
  .validator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertJourneyAccess(context.userId, data.journeyId);
    return runAnalysisInternal(data.journeyId);
  });

export const getResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => IdSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, journey } = await assertJourneyAccess(context.userId, data.journeyId);

    const { data: result } = await supabaseAdmin
      .from("results")
      .select("*")
      .eq("journey_id", data.journeyId)
      .maybeSingle();

    let analysis: AnalysisPayload | null = null;
    if (result?.ai_summary) {
      try {
        analysis = parseAnalysisPayload(result.ai_summary);
      } catch {
        analysis = null;
      }
    }
    let pairAnalysis: PairAnalysisPayload | null = null;
    if (journey.pair_id) {
      const { data: pair } = await (supabaseAdmin as any)
        .from("journey_pairs")
        .select("id, comparison_summary")
        .eq("id", journey.pair_id)
        .maybeSingle();
      if (pair?.comparison_summary) {
        try {
          pairAnalysis = parsePairAnalysisPayload(pair.comparison_summary);
        } catch {
          pairAnalysis = null;
        }
      }
      if (!pairAnalysis) {
        try {
          const generated = await buildPairAnalysisInternal(journey.pair_id);
          pairAnalysis = generated.analysis;
        } catch (error) {
          console.error("[pair-analysis] generation skipped", {
            journeyId: data.journeyId,
            pairId: journey.pair_id,
            error,
          });
        }
      }
    }
    return {
      journey: {
        id: journey.id,
        title: journey.title,
        participant_type: journey.participant_type,
        status: journey.status,
        pair_id: journey.pair_id,
        pair_side: journey.pair_side,
      },
      result: result ?? null,
      analysis,
      analysisAvailable: isAiAnalysisEnabled(),
      share: {
        enabled: Boolean(result?.share_enabled),
        token: (result?.share_token as string | null) ?? null,
      },
      pairAnalysis,
    };
  });

const ShareSchema = z.object({
  journeyId: z.string().uuid(),
  enabled: z.boolean(),
});

export const toggleShareReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => ShareSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await assertJourneyAccess(context.userId, data.journeyId, {
      ownerOnly: true,
    });

    const { data: existing } = await supabaseAdmin
      .from("results")
      .select("id, share_token, share_enabled")
      .eq("journey_id", data.journeyId)
      .maybeSingle();
    if (!existing) throw new Error("No report exists for this journey yet.");

    let token = existing.share_token as string | null;
    // A revoked URL must stay revoked. Generate a fresh token whenever sharing
    // moves from disabled to enabled instead of resurrecting the old URL.
    if (data.enabled && (!token || !existing.share_enabled)) {
      const bytes = new Uint8Array(18);
      crypto.getRandomValues(bytes);
      token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }

    const { error } = await supabaseAdmin
      .from("results")
      .update({ share_enabled: data.enabled, share_token: token })
      .eq("id", existing.id);
    if (error) {
      console.error("[shared-report] Update failed", { code: error.code });
      throw new Error("Sharing could not be updated. Please try again.");
    }

    return { enabled: data.enabled, token: data.enabled ? token : null };
  });

const TokenSchema = z.object({ token: z.string().trim().min(8).max(128) });

export const getSharedReport = createServerFn({ method: "POST" })
  .validator((d: unknown) => TokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { callerIp, consumeRateLimits } = await import("./rate-limit.server");
    await consumeRateLimits([
      {
        action: "shared_report_ip",
        value: callerIp(),
        windowSeconds: 60 * 60,
        maxEvents: 120,
      },
    ]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: result, error } = await supabaseAdmin
      .from("results")
      .select("*, journeys!inner(title, participant_type, pair_id)")
      .eq("share_token", data.token)
      .eq("share_enabled", true)
      .maybeSingle();
    if (error) {
      console.error("[shared-report] Lookup failed", { code: error.code });
      throw new Error("This shared report is unavailable.");
    }
    if (!result) throw new Error("This shared report is unavailable.");

    let analysis: AnalysisPayload | null = null;
    if (result.ai_summary) {
      try {
        analysis = parseAnalysisPayload(result.ai_summary);
      } catch {
        analysis = null;
      }
    }

    const j = (
      result as { journeys: { title: string; participant_type: string; pair_id: string | null } }
    ).journeys;
    let pairAnalysis: PairAnalysisPayload | null = null;
    if (j.pair_id) {
      const { data: pair } = await (supabaseAdmin as any)
        .from("journey_pairs")
        .select("comparison_summary")
        .eq("id", j.pair_id)
        .maybeSingle();
      if (pair?.comparison_summary) {
        try {
          pairAnalysis = parsePairAnalysisPayload(pair.comparison_summary);
        } catch {
          pairAnalysis = null;
        }
      }
    }
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
      pairAnalysis,
    };
  });
