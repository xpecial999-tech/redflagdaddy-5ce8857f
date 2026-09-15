import {
  pairInsightCopy,
  pairInsightPriority,
  pairInsightSeverity,
} from "@/lib/pair-comparison-rules";

export type PairScores = {
  safety: number;
  compatibility: number;
  red: number;
  green: number;
  experience: number;
};

export type PairSideSummary = {
  journeyId: string;
  title: string;
  role: string;
  scores: PairScores;
};

export type PairInsight = {
  title: string;
  summary: string;
  owner: string;
  partner: string;
  prompt: string;
  severity: "strength" | "watch" | "concern";
  dimension?: "safety" | "consent" | "communication" | "compatibility" | "green_flags" | "red_flags" | "experience";
};

export type PairAnalysisPayload = {
  kind: "pair_comparison";
  owner: PairSideSummary;
  partner: PairSideSummary;
  overall: {
    score: number;
    label: "Strong alignment" | "Workable alignment" | "Needs discussion" | "Slow down";
    summary: string;
  };
  score_deltas: {
    safety: number;
    compatibility: number;
    red: number;
    green: number;
    experience: number;
  };
  shared_strengths: string[];
  discussion_points: string[];
  watchouts: string[];
  question_insights: PairInsight[];
  next_steps: string[];
  generated_at: string;
};

type PairInput = {
  owner: PairSideSummary;
  partner: PairSideSummary;
  matches: Array<{
    question: string;
    category: string;
    risk: string;
    ownerAnswer: unknown;
    partnerAnswer: unknown;
    ownerScore: number;
    partnerScore: number;
  }>;
};

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function delta(a: number, b: number) {
  return Math.abs(clamp(a) - clamp(b));
}

function label(score: number): PairAnalysisPayload["overall"]["label"] {
  if (score >= 78) return "Strong alignment";
  if (score >= 62) return "Workable alignment";
  if (score >= 42) return "Needs discussion";
  return "Slow down";
}

function answerText(value: unknown): string {
  if (typeof value === "string") return value.trim().slice(0, 160) || "No answer text";
  if (Array.isArray(value)) return value.map(answerText).join(", ").slice(0, 160) || "No answer text";
  if (value && typeof value === "object") return JSON.stringify(value).slice(0, 160);
  return "No answer text";
}

function sharedStrength(scores: PairScores) {
  const strengths: string[] = [];
  if (scores.safety >= 70) strengths.push("Safety signals are strong enough to support a clearer negotiation conversation.");
  if (scores.green >= 70) strengths.push("Both sides show useful green-flag signals to build from.");
  if (scores.compatibility >= 70) strengths.push("The overall compatibility pattern shows promising overlap.");
  if (scores.red < 30) strengths.push("Red-flag levels are low enough that the report can focus on detail rather than crisis signals.");
  return strengths;
}

export function buildPairAnalysis(input: PairInput): PairAnalysisPayload {
  const owner = input.owner;
  const partner = input.partner;
  const deltas = {
    safety: delta(owner.scores.safety, partner.scores.safety),
    compatibility: delta(owner.scores.compatibility, partner.scores.compatibility),
    red: delta(owner.scores.red, partner.scores.red),
    green: delta(owner.scores.green, partner.scores.green),
    experience: delta(owner.scores.experience, partner.scores.experience),
  };

  const averageSafety = (clamp(owner.scores.safety) + clamp(partner.scores.safety)) / 2;
  const averageCompatibility = (clamp(owner.scores.compatibility) + clamp(partner.scores.compatibility)) / 2;
  const averageGreen = (clamp(owner.scores.green) + clamp(partner.scores.green)) / 2;
  const averageExperience = (clamp(owner.scores.experience) + clamp(partner.scores.experience)) / 2;
  const highestRed = Math.max(clamp(owner.scores.red), clamp(partner.scores.red));
  const mismatchPenalty =
    (deltas.safety * 0.28 + deltas.compatibility * 0.2 + deltas.red * 0.24 + deltas.green * 0.16 + deltas.experience * 0.12) /
    2;
  const overallScore = clamp(
    averageSafety * 0.28 +
      averageCompatibility * 0.2 +
      averageGreen * 0.18 +
      averageExperience * 0.1 +
      Math.max(0, 100 - highestRed) * 0.24 -
      mismatchPenalty,
  );

  const questionInsights = input.matches
    .map((match): PairInsight & { priority: number } => {
      const gap = Math.abs(match.ownerScore - match.partnerScore);
      const severity = pairInsightSeverity({
        category: match.category,
        risk: match.risk,
        scoreGap: gap,
      });
      const copy = pairInsightCopy({ category: match.category, severity });
      return {
        title: match.question,
        summary: copy.summary,
        owner: answerText(match.ownerAnswer),
        partner: answerText(match.partnerAnswer),
        prompt: copy.prompt,
        severity,
        dimension: copy.dimension,
        priority: pairInsightPriority({
          category: match.category,
          risk: match.risk,
          scoreGap: gap,
          severity,
        }),
      };
    })
    .sort((a, b) => {
      const rank = { concern: 2, watch: 1, strength: 0 };
      const severitySort = rank[b.severity] - rank[a.severity];
      return severitySort || b.priority - a.priority;
    })
    .slice(0, 8)
    .map(({ priority: _priority, ...insight }) => insight);

  const discussionPoints = [
    ...(deltas.safety >= 25 ? ["Safety expectations differ enough to confirm safewords, stop signals and aftercare in detail."] : []),
    ...(deltas.compatibility >= 25 ? ["Compatibility scores differ; compare pacing, structure and expectations before assuming overlap."] : []),
    ...(deltas.experience >= 25 ? ["Experience levels differ; agree a slower pace and avoid assuming shared vocabulary."] : []),
    ...(highestRed >= 30 ? ["At least one side has elevated red-flag signals. Talk through those before escalation."] : []),
    ...questionInsights.filter((item) => item.severity !== "strength").slice(0, 3).map((item) => item.prompt),
  ];

  const hasBlockingConcern = questionInsights.some(
    (item) =>
      item.severity === "concern" &&
      (item.dimension === "consent" || item.dimension === "safety" || item.dimension === "red_flags"),
  );

  const watchouts = [
    ...(hasBlockingConcern
      ? ["Blocking consent, safety or red-flag conflicts should be resolved before any escalation."]
      : []),
    ...(highestRed >= 60 ? ["One side has serious red-flag signals; slow down until those are resolved."] : []),
    ...(averageSafety < 50 ? ["Average safety score is not strong enough to rely on implied understanding."] : []),
    ...(questionInsights.some((item) => item.severity === "concern") ? ["High-risk question differences should be resolved directly, not softened into general compatibility."] : []),
  ];

  const strengths = [
    ...sharedStrength({
      safety: Math.round(averageSafety),
      compatibility: Math.round(averageCompatibility),
      red: highestRed,
      green: Math.round(averageGreen),
      experience: Math.round(averageExperience),
    }),
    ...questionInsights.filter((item) => item.severity === "strength").slice(0, 2).map((item) => item.title),
  ].slice(0, 5);

  return {
    kind: "pair_comparison",
    owner,
    partner,
    overall: {
      score: overallScore,
      label: label(overallScore),
      summary:
        overallScore >= 62
          ? "The paired results show enough alignment to support a structured follow-up conversation."
          : "The paired results need careful discussion before either person treats the dynamic as aligned.",
    },
    score_deltas: deltas,
    shared_strengths: strengths.length ? strengths : ["Use the matching report as a structured agenda for a careful conversation."],
    discussion_points: discussionPoints.length ? discussionPoints.slice(0, 6) : ["Compare limits, pacing, aftercare and expectations in plain language."],
    watchouts: watchouts.length ? watchouts.slice(0, 5) : ["Low red-flag scores are not proof of safety; consent still needs to be current and specific."],
    question_insights: questionInsights,
    next_steps: [
      ...(hasBlockingConcern
        ? ["Resolve blocking consent, safety or red-flag items before treating the match as workable."]
        : []),
      "Discuss any high-risk or high-gap items before escalating the dynamic.",
      "Write down hard limits, soft limits, safewords, check-ins and aftercare expectations.",
      "Treat this as a conversation guide, not proof of consent or a guarantee of safety.",
    ],
    generated_at: new Date().toISOString(),
  };
}
