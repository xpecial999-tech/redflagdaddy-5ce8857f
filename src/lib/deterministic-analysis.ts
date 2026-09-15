import type { AnalysisPayload, AnalysisSection } from "@/lib/analysis.functions";

export type DeterministicScoreBundle = {
  safety_score: number;
  compatibility_score: number;
  red_flag_score: number;
  green_flag_score: number;
  experience_score: number;
};

type DigestItem = {
  q: string;
  a: unknown;
  risk: string;
  score: number;
};

type DigestCategory = {
  total: number;
  topRisk: DigestItem[];
};

type AnswerDigest = Record<string, DigestCategory>;

function score(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function redFlagBand(red: number): "low" | "elevated" | "serious" {
  if (red >= 60) return "serious";
  if (red >= 30) return "elevated";
  return "low";
}

function readinessLabel(value: number): AnalysisPayload["dynamic_readiness"]["label"] {
  if (value >= 85) return "Strongly ready";
  if (value >= 70) return "Ready";
  if (value >= 50) return "Developing";
  if (value >= 30) return "Early stage";
  return "Not ready";
}

function cleanText(value: unknown, fallback = "the selected answer"): string {
  if (typeof value === "string") return value.trim().slice(0, 160) || fallback;
  if (Array.isArray(value)) {
    const text = value.map((item) => cleanText(item, "")).filter(Boolean).join(", ");
    return text.slice(0, 160) || fallback;
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value).slice(0, 160);
  }
  return fallback;
}

function categoryItems(digest: unknown, names: string[]): DigestItem[] {
  const typed = (digest ?? {}) as AnswerDigest;
  return names.flatMap((name) => typed[name]?.topRisk ?? []).slice(0, 6);
}

function notable(category: DigestItem[], limit = 3): string[] {
  return category
    .slice(0, limit)
    .map((item) => `${item.q}: ${cleanText(item.a)}`)
    .filter(Boolean);
}

function buildSection(input: {
  title: string;
  summary: string;
  strengths?: string[];
  risks?: string[];
  missing?: string[];
  concerns?: string[];
}): AnalysisSection {
  return {
    title: input.title,
    summary: input.summary,
    strengths: input.strengths ?? [],
    risks: input.risks ?? [],
    missing_information: input.missing ?? [],
    concerns: input.concerns ?? [],
  };
}

export function buildDeterministicAnalysis(
  rawScores: DeterministicScoreBundle,
  digest: unknown,
): AnalysisPayload {
  const safety = score(rawScores.safety_score);
  const compatibility = score(rawScores.compatibility_score);
  const red = score(rawScores.red_flag_score);
  const green = score(rawScores.green_flag_score);
  const experience = score(rawScores.experience_score);
  const redBand = redFlagBand(red);

  const safetyItems = categoryItems(digest, ["BDSM Safety", "Safety Practices"]);
  const redItems = categoryItems(digest, ["Red Flags"]);
  const greenItems = categoryItems(digest, ["Green Flags"]);
  const compatibilityItems = categoryItems(digest, ["Compatibility"]);
  const communicationItems = categoryItems(digest, ["Communication", "Consent & Communication"]);
  const consentItems = categoryItems(digest, ["Consent", "Consent & Boundaries"]);

  const readiness = score(
    safety * 0.28 +
      compatibility * 0.18 +
      green * 0.18 +
      experience * 0.12 +
      Math.max(0, 100 - red) * 0.24,
  );

  const elevatedRedCopy =
    redBand === "serious"
      ? "Red-flag signals are serious enough to slow the pace and resolve them directly before escalation."
      : redBand === "elevated"
        ? "Some red-flag signals are elevated and should be discussed clearly before deeper engagement."
        : "Red-flag signals are low from the available answers, though this is not a guarantee of safety.";

  const safetySummary =
    safety >= 75
      ? "Safety signals are strong. The answers suggest good attention to consent, limits and risk management."
      : safety >= 45
        ? "Safety signals are mixed. Treat this as a prompt to clarify protocols, limits and aftercare before relying on the result."
        : "Safety signals are limited. This area needs a direct conversation before any escalation in intensity.";

  const compatibilitySummary =
    compatibility >= 70
      ? "Compatibility signals suggest useful overlap in expectations and preferred dynamic structure."
      : compatibility >= 40
        ? "Compatibility is mixed. There may be workable overlap, but expectations should be compared carefully."
        : "Compatibility signals are limited. Use the report as a prompt for a slower, more explicit conversation.";

  return {
    safety: buildSection({
      title: "Safety Practices",
      summary: safetySummary,
      strengths: [
        ...(safety >= 70 ? ["Safety score is in the stronger range."] : []),
        ...notable(safetyItems, 2),
      ],
      risks: safety < 60 ? ["Safety score is not yet strong enough to treat assumptions as shared."] : [],
      missing: [
        "Confirm safewords, non-verbal stop signals, health considerations and aftercare expectations explicitly.",
      ],
      concerns:
        safety < 40
          ? ["Do not escalate intensity until basic safety protocols are agreed and understood."]
          : [],
    }),
    consent: buildSection({
      title: "Consent & Boundaries",
      summary:
        redBand === "serious"
          ? "Consent and boundary handling needs careful review because red-flag signals are high."
          : "Consent should be treated as current, specific and revocable. Use this section to confirm hard limits, soft limits and check-in expectations.",
      strengths: notable(consentItems, 2),
      risks:
        red >= 30
          ? ["Red-flag score suggests at least one consent or boundary topic may need direct discussion."]
          : [],
      missing: ["Record hard limits and any flexible areas in plain language before proceeding."],
      concerns:
        red >= 60
          ? ["Elevated red flags should be resolved before treating compatibility as meaningful."]
          : [],
    }),
    red_flags: buildSection({
      title: "Red Flags",
      summary: elevatedRedCopy,
      strengths: red < 30 ? ["No elevated red-flag score from the completed answers."] : [],
      risks: [
        ...(red >= 30 ? [`Red flag score is ${red}/100.`] : []),
        ...notable(redItems, 3),
      ],
      missing: redItems.length === 0 ? ["No detailed red-flag answer digest was available."] : [],
      concerns:
        red >= 60
          ? ["Treat this as a slow-down signal, not a minor footnote."]
          : red >= 30
            ? ["Talk through the elevated items before increasing trust or intensity."]
            : [],
    }),
    green_flags: buildSection({
      title: "Green Flags",
      summary:
        green >= 70
          ? "Green-flag signals are strong and should be used as anchors for the next conversation."
          : green >= 40
            ? "Some constructive signals are present, but they need concrete examples and follow-through."
            : "Green-flag signals are limited from the available answers.",
      strengths: [
        ...(green >= 70 ? ["Green-flag score is in the stronger range."] : []),
        ...notable(greenItems, 3),
      ],
      risks: green < 40 ? ["Positive compatibility signals may not yet be well evidenced."] : [],
      missing: ["Ask for concrete examples rather than relying only on self-report."],
    }),
    communication: buildSection({
      title: "Communication",
      summary:
        safety >= 65 && red < 40
          ? "Communication appears workable enough to support a structured negotiation conversation."
          : "Communication should be made explicit, especially around discomfort, silence, feedback and ending a scene early.",
      strengths: notable(communicationItems, 2),
      risks:
        red >= 30
          ? ["Where red flags are present, assume silence or vagueness is a risk signal to clarify."]
          : [],
      missing: ["Agree how concerns will be raised during and after a scene."],
    }),
    compatibility: buildSection({
      title: "Compatibility",
      summary: compatibilitySummary,
      strengths: [
        ...(compatibility >= 70 ? ["Compatibility score is in the stronger range."] : []),
        ...notable(compatibilityItems, 2),
      ],
      risks:
        compatibility < 50
          ? ["Shared preferences may not be clear enough yet to rely on the score alone."]
          : [],
      missing: ["Compare pacing, relationship structure, hard limits and aftercare expectations side by side."],
    }),
    dynamic_readiness: {
      score: readiness,
      label: readinessLabel(readiness),
      rationale:
        readiness >= 70
          ? "Readiness is supported by stronger safety/green-flag signals and manageable red-flag levels."
          : readiness >= 50
            ? "Readiness is developing, but one or more areas need clarification before deeper engagement."
            : "Readiness is limited by safety, compatibility, experience or red-flag concerns that need direct discussion.",
      strengths: [
        ...(safety >= 70 ? ["Safety score supports structured negotiation."] : []),
        ...(green >= 70 ? ["Green-flag score suggests constructive habits to build on."] : []),
      ],
      risks: [
        ...(red >= 30 ? [`Red-flag score is ${red}/100.`] : []),
        ...(experience < 40 ? ["Experience score suggests pacing should be gradual."] : []),
      ],
      missing_information: [
        "This deterministic report does not verify identity, intent or real-world behaviour.",
      ],
      concerns:
        red >= 60
          ? ["Resolve serious red-flag items before escalation."]
          : [],
    },
    overall_note:
      "This report is generated from the structured scoring matrix and highlighted answer patterns. Use it as a conversation agenda: confirm limits, clarify risk items, agree safety protocols and proceed gradually. It is not proof of consent, identity verification, a diagnosis or a guarantee of safety.",
    generated_at: new Date().toISOString(),
  };
}
