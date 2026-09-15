export type PairInsightSeverity = "strength" | "watch" | "concern";

export type PairComparisonRule = {
  dimension:
    | "safety"
    | "consent"
    | "communication"
    | "compatibility"
    | "green_flags"
    | "red_flags"
    | "experience";
  concernGap: number;
  watchGap: number;
  priorityWeight: number;
  alignedSummary: string;
  watchSummary: string;
  concernSummary: string;
  prompt: string;
};

const DEFAULT_RULE: PairComparisonRule = {
  dimension: "compatibility",
  concernGap: 4,
  watchGap: 2,
  priorityWeight: 1,
  alignedSummary: "Both answers appear broadly aligned on this prompt.",
  watchSummary: "The answers differ enough to make this worth discussing explicitly.",
  concernSummary: "This prompt has a meaningful difference that should be clarified before relying on the result.",
  prompt: "Compare what each person meant before treating this area as agreed.",
};

const CATEGORY_RULES: Record<string, PairComparisonRule> = {
  "bdsm safety": {
    dimension: "safety",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.45,
    alignedSummary: "Both answers appear aligned on a safety-related prompt.",
    watchSummary: "Safety expectations differ enough to confirm the practical details.",
    concernSummary: "This safety prompt needs direct agreement before escalation.",
    prompt: "Confirm safewords, non-verbal stop signals, aftercare and what each person will do if something feels wrong.",
  },
  "safety practices": {
    dimension: "safety",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.45,
    alignedSummary: "Both answers appear aligned on a safety-related prompt.",
    watchSummary: "Safety expectations differ enough to confirm the practical details.",
    concernSummary: "This safety prompt needs direct agreement before escalation.",
    prompt: "Confirm safewords, non-verbal stop signals, aftercare and what each person will do if something feels wrong.",
  },
  consent: {
    dimension: "consent",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.55,
    alignedSummary: "Both answers appear aligned on consent and boundary handling.",
    watchSummary: "Consent or boundary expectations differ enough to discuss clearly.",
    concernSummary: "This consent prompt should be resolved directly; do not rely on implied agreement.",
    prompt: "State hard limits, soft limits, pause signals and what counts as a current yes in plain language.",
  },
  "consent & boundaries": {
    dimension: "consent",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.55,
    alignedSummary: "Both answers appear aligned on consent and boundary handling.",
    watchSummary: "Consent or boundary expectations differ enough to discuss clearly.",
    concernSummary: "This consent prompt should be resolved directly; do not rely on implied agreement.",
    prompt: "State hard limits, soft limits, pause signals and what counts as a current yes in plain language.",
  },
  communication: {
    dimension: "communication",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1.2,
    alignedSummary: "Both answers suggest similar communication expectations.",
    watchSummary: "Communication expectations differ enough to choose a clearer check-in plan.",
    concernSummary: "This communication gap may make consent, feedback or stopping harder in practice.",
    prompt: "Agree how each person will raise discomfort, uncertainty, feedback and the need to stop.",
  },
  "consent & communication": {
    dimension: "communication",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.35,
    alignedSummary: "Both answers suggest similar consent and communication expectations.",
    watchSummary: "Consent and communication expectations differ enough to choose a clearer check-in plan.",
    concernSummary: "This gap may make consent, feedback or stopping harder in practice.",
    prompt: "Agree how each person will raise discomfort, uncertainty, feedback and the need to stop.",
  },
  compatibility: {
    dimension: "compatibility",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1,
    alignedSummary: "Both answers show useful overlap on this compatibility prompt.",
    watchSummary: "The answers differ enough to compare expectations before assuming overlap.",
    concernSummary: "This compatibility gap could affect pacing, structure or expectations.",
    prompt: "Compare preferred pace, structure and what each person would need for this to feel workable.",
  },
  "red flags": {
    dimension: "red_flags",
    concernGap: 2,
    watchGap: 1,
    priorityWeight: 1.7,
    alignedSummary: "Both answers appear aligned on this red-flag prompt.",
    watchSummary: "A red-flag prompt shows a difference that should be clarified, even if it seems small.",
    concernSummary: "This red-flag prompt should slow the process until it is resolved clearly.",
    prompt: "Name the risk plainly, decide what would stop the journey, and do not soften this into general compatibility.",
  },
  "green flags": {
    dimension: "green_flags",
    concernGap: 5,
    watchGap: 3,
    priorityWeight: 0.8,
    alignedSummary: "Both answers show a similar constructive signal.",
    watchSummary: "The green-flag signal differs; ask for concrete examples before relying on it.",
    concernSummary: "The expected positive behaviour may not mean the same thing to both people.",
    prompt: "Ask for examples of what this positive behaviour looks like in practice.",
  },
  experience: {
    dimension: "experience",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 0.9,
    alignedSummary: "Both answers suggest similar experience context.",
    watchSummary: "Experience levels differ enough to slow down and define terms clearly.",
    concernSummary: "The experience gap may affect pacing, vocabulary and assumptions.",
    prompt: "Agree a pace that works for the less experienced person and avoid assuming shared vocabulary.",
  },
};

const RISK_WEIGHT: Record<string, number> = {
  critical: 2.2,
  high: 1.6,
  medium: 1.15,
  low: 1,
};

function key(value: string): string {
  return value.trim().toLowerCase();
}

export function ruleForCategory(category: string): PairComparisonRule {
  return CATEGORY_RULES[key(category)] ?? DEFAULT_RULE;
}

export function pairInsightSeverity(input: {
  category: string;
  risk: string;
  scoreGap: number;
}): PairInsightSeverity {
  const rule = ruleForCategory(input.category);
  const risk = key(input.risk);
  if (risk === "critical" && input.scoreGap >= Math.max(1, rule.watchGap)) return "concern";
  if (risk === "high" && input.scoreGap >= rule.watchGap) return "concern";
  if (input.scoreGap >= rule.concernGap) return "concern";
  if (input.scoreGap >= rule.watchGap) return "watch";
  return "strength";
}

export function pairInsightPriority(input: {
  category: string;
  risk: string;
  scoreGap: number;
  severity: PairInsightSeverity;
}): number {
  const rule = ruleForCategory(input.category);
  const severityWeight = input.severity === "concern" ? 3 : input.severity === "watch" ? 2 : 1;
  return input.scoreGap * rule.priorityWeight * (RISK_WEIGHT[key(input.risk)] ?? 1) * severityWeight;
}

export function pairInsightCopy(input: {
  category: string;
  severity: PairInsightSeverity;
}): { summary: string; prompt: string; dimension: PairComparisonRule["dimension"] } {
  const rule = ruleForCategory(input.category);
  return {
    summary:
      input.severity === "concern"
        ? rule.concernSummary
        : input.severity === "watch"
          ? rule.watchSummary
          : rule.alignedSummary,
    prompt: rule.prompt,
    dimension: rule.dimension,
  };
}
