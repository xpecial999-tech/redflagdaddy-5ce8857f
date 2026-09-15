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
  concernSummary:
    "This prompt has a meaningful difference that should be clarified before relying on the result.",
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
    prompt:
      "Confirm safewords, non-verbal stop signals, aftercare and what each person will do if something feels wrong.",
  },
  "safety practices": {
    dimension: "safety",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.45,
    alignedSummary: "Both answers appear aligned on a safety-related prompt.",
    watchSummary: "Safety expectations differ enough to confirm the practical details.",
    concernSummary: "This safety prompt needs direct agreement before escalation.",
    prompt:
      "Confirm safewords, non-verbal stop signals, aftercare and what each person will do if something feels wrong.",
  },
  "bdsm experience": {
    dimension: "experience",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1,
    alignedSummary: "Both answers suggest similar BDSM experience context.",
    watchSummary: "Experience or education differs enough to slow down and define terms clearly.",
    concernSummary:
      "This experience gap may affect pacing, vocabulary and practical safety assumptions.",
    prompt:
      "Agree a pace that works for the less experienced person and avoid assuming shared vocabulary or technique.",
  },
  aftercare: {
    dimension: "safety",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.35,
    alignedSummary: "Both answers appear aligned on aftercare expectations.",
    watchSummary: "Aftercare expectations differ enough to plan them before play.",
    concernSummary: "This aftercare difference should be resolved before intense scenes.",
    prompt:
      "Agree what aftercare means, when it happens, and what each person needs in the hours after a scene.",
  },
  consent: {
    dimension: "consent",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.55,
    alignedSummary: "Both answers appear aligned on consent and boundary handling.",
    watchSummary: "Consent or boundary expectations differ enough to discuss clearly.",
    concernSummary:
      "This consent prompt should be resolved directly; do not rely on implied agreement.",
    prompt:
      "State hard limits, soft limits, pause signals and what counts as a current yes in plain language.",
  },
  "consent & boundaries": {
    dimension: "consent",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.55,
    alignedSummary: "Both answers appear aligned on consent and boundary handling.",
    watchSummary: "Consent or boundary expectations differ enough to discuss clearly.",
    concernSummary:
      "This consent prompt should be resolved directly; do not rely on implied agreement.",
    prompt:
      "State hard limits, soft limits, pause signals and what counts as a current yes in plain language.",
  },
  boundaries: {
    dimension: "consent",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.5,
    alignedSummary: "Both answers appear aligned on limits and boundaries.",
    watchSummary: "Boundary expectations differ enough to discuss clearly.",
    concernSummary:
      "This boundary prompt should be resolved directly; do not rely on implied agreement.",
    prompt:
      "State hard limits, soft limits, flexible areas and what happens if a boundary is reached.",
  },
  communication: {
    dimension: "communication",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1.2,
    alignedSummary: "Both answers suggest similar communication expectations.",
    watchSummary: "Communication expectations differ enough to choose a clearer check-in plan.",
    concernSummary:
      "This communication gap may make consent, feedback or stopping harder in practice.",
    prompt:
      "Agree how each person will raise discomfort, uncertainty, feedback and the need to stop.",
  },
  "consent & communication": {
    dimension: "communication",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.35,
    alignedSummary: "Both answers suggest similar consent and communication expectations.",
    watchSummary:
      "Consent and communication expectations differ enough to choose a clearer check-in plan.",
    concernSummary: "This gap may make consent, feedback or stopping harder in practice.",
    prompt:
      "Agree how each person will raise discomfort, uncertainty, feedback and the need to stop.",
  },
  compatibility: {
    dimension: "compatibility",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1,
    alignedSummary: "Both answers show useful overlap on this compatibility prompt.",
    watchSummary: "The answers differ enough to compare expectations before assuming overlap.",
    concernSummary: "This compatibility gap could affect pacing, structure or expectations.",
    prompt:
      "Compare preferred pace, structure and what each person would need for this to feel workable.",
  },
  accountability: {
    dimension: "communication",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.35,
    alignedSummary: "Both answers appear aligned on accountability expectations.",
    watchSummary: "Accountability expectations differ enough to agree a repair process.",
    concernSummary: "This accountability gap may make boundary repair harder in practice.",
    prompt:
      "Agree what apology, repair, documentation and outside support would look like if something goes wrong.",
  },
  "attachment style": {
    dimension: "compatibility",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 0.9,
    alignedSummary: "Both answers suggest compatible emotional-security expectations.",
    watchSummary: "Emotional-security needs differ enough to name them directly.",
    concernSummary:
      "This emotional-security gap could affect pacing, reassurance and conflict recovery.",
    prompt:
      "Compare reassurance needs, alone time, vulnerability and what helps each person feel secure.",
  },
  "conflict resolution": {
    dimension: "communication",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.35,
    alignedSummary: "Both answers suggest similar conflict-repair expectations.",
    watchSummary: "Conflict-repair expectations differ enough to choose a clearer process.",
    concernSummary:
      "This conflict-resolution gap may make consent, repair or stopping harder in practice.",
    prompt: "Agree how conflict will pause, de-escalate, resume and repair without pressure.",
  },
  "emotional intelligence": {
    dimension: "communication",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1.15,
    alignedSummary: "Both answers suggest similar emotional-awareness expectations.",
    watchSummary: "Emotional-awareness expectations differ enough to discuss check-ins.",
    concernSummary: "This emotional-awareness gap may affect how distress or feedback is noticed.",
    prompt: "Compare how each person names emotions, receives feedback and notices distress.",
  },
  "financial responsibility": {
    dimension: "compatibility",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.45,
    alignedSummary: "Both answers appear aligned on financial boundaries.",
    watchSummary: "Financial expectations differ enough to define hard limits.",
    concernSummary:
      "This financial-boundary gap should be resolved before any financial power exchange.",
    prompt:
      "Set financial hard limits, budgets, cooling-off periods and what is never part of the dynamic.",
  },
  "power exchange": {
    dimension: "compatibility",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1.1,
    alignedSummary: "Both answers suggest similar power-exchange expectations.",
    watchSummary: "Power-exchange expectations differ enough to compare structure and pacing.",
    concernSummary:
      "This power-exchange gap could affect rules, escalation or day-to-day expectations.",
    prompt:
      "Compare desired structure, rules, renegotiation cadence and what remains outside the dynamic.",
  },
  "relationship goals": {
    dimension: "compatibility",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1.05,
    alignedSummary: "Both answers suggest similar relationship goals.",
    watchSummary: "Relationship goals differ enough to clarify expectations before assuming fit.",
    concernSummary: "This relationship-goal gap could affect whether the dynamic is workable.",
    prompt:
      "Compare relationship structure, exclusivity, intensity, availability and long-term expectations.",
  },
  trust: {
    dimension: "compatibility",
    concernGap: 3,
    watchGap: 2,
    priorityWeight: 1.35,
    alignedSummary: "Both answers appear aligned on trust-building expectations.",
    watchSummary: "Trust expectations differ enough to ask for concrete examples.",
    concernSummary:
      "This trust gap should be clarified before increasing vulnerability or intensity.",
    prompt:
      "Ask what earns trust, what damages it, and what proof of repair each person would need.",
  },
  "red flags": {
    dimension: "red_flags",
    concernGap: 2,
    watchGap: 1,
    priorityWeight: 1.7,
    alignedSummary: "Both answers appear aligned on this red-flag prompt.",
    watchSummary:
      "A red-flag prompt shows a difference that should be clarified, even if it seems small.",
    concernSummary: "This red-flag prompt should slow the process until it is resolved clearly.",
    prompt:
      "Name the risk plainly, decide what would stop the journey, and do not soften this into general compatibility.",
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
    prompt:
      "Agree a pace that works for the less experienced person and avoid assuming shared vocabulary.",
  },
  "dominant skills": {
    dimension: "experience",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1,
    alignedSummary: "Both answers suggest compatible Dominant-side skill expectations.",
    watchSummary:
      "Dominant-side skill expectations differ enough to slow down and define responsibilities.",
    concernSummary: "This Dominant-side skill gap may affect pacing, safety and assumptions.",
    prompt: "Clarify technique, education, responsibilities and what should not be attempted yet.",
  },
  "submissive skills": {
    dimension: "experience",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 1,
    alignedSummary: "Both answers suggest compatible submissive-side skill expectations.",
    watchSummary:
      "Submissive-side skill expectations differ enough to slow down and define responsibilities.",
    concernSummary: "This submissive-side skill gap may affect pacing, safety and assumptions.",
    prompt:
      "Clarify self-advocacy, safewords, aftercare needs and what should not be attempted yet.",
  },
  "community involvement": {
    dimension: "experience",
    concernGap: 4,
    watchGap: 2,
    priorityWeight: 0.85,
    alignedSummary: "Both answers suggest similar community or education context.",
    watchSummary: "Community/education context differs enough to define shared standards.",
    concernSummary: "This gap may affect assumptions about etiquette, reporting and safety norms.",
    prompt:
      "Compare preferred community standards, event safety expectations and education sources.",
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
  return (
    input.scoreGap * rule.priorityWeight * (RISK_WEIGHT[key(input.risk)] ?? 1) * severityWeight
  );
}

export function pairInsightCopy(input: { category: string; severity: PairInsightSeverity }): {
  summary: string;
  prompt: string;
  dimension: PairComparisonRule["dimension"];
} {
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
