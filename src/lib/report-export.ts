import type { AnalysisPayload, AnalysisSection } from "@/lib/analysis.functions";

export type ReportScores = {
  safety: number;
  compatibility: number;
  red: number;
  green: number;
  experience: number;
};

export type ReportExportInput = {
  title: string;
  participantType: string;
  scores: ReportScores;
  analysis: AnalysisPayload;
};

export type PrivateReportJsonV1 = {
  schema: "redflagdaddy.private-report.v1";
  privacy: { audience: "private-owner-export"; omitted: string[] };
  journey: { title: string; partnerRole: string };
  scores: ReportScores;
  dynamicReadiness: {
    score: number;
    label: string;
    rationale: string;
    strengths: string[];
    risks: string[];
    missingInformation: string[];
    concerns: string[];
  };
  sections: Array<{
    key: string;
    title: string;
    summary: string;
    strengths: string[];
    risks: string[];
    missingInformation: string[];
    concerns: string[];
  }>;
  overallNote: string;
  disclaimer: string;
};

const DISCLAIMER =
  "RedFlagDaddy is a structured conversation aid, not identity verification, a background check, a diagnosis, proof of consent, an emergency service or a guarantee of safety. Consent is current, specific and revocable.";

const SECTION_ORDER: Array<[keyof AnalysisPayload, string]> = [
  ["safety", "Safety"],
  ["consent", "Consent"],
  ["communication", "Communication"],
  ["compatibility", "Compatibility"],
  ["red_flags", "Potential red flags"],
  ["green_flags", "Green flags"],
];

export type SelectableReportDimension =
  | "safety"
  | "consent"
  | "communication"
  | "compatibility"
  | "green_flags"
  | "red_flags";

export const SELECTABLE_REPORT_DIMENSIONS: Array<{
  key: SelectableReportDimension;
  label: string;
}> = [
  { key: "safety", label: "Safety" },
  { key: "consent", label: "Consent" },
  { key: "communication", label: "Communication" },
  { key: "compatibility", label: "Compatibility" },
  { key: "green_flags", label: "Green flags" },
  { key: "red_flags", label: "Potential red flags" },
];

const DIMENSION_SCORE: Partial<Record<SelectableReportDimension, keyof ReportScores>> = {
  safety: "safety",
  compatibility: "compatibility",
  green_flags: "green",
  red_flags: "red",
};

function inline(value: unknown): string {
  return String(value ?? "")
    .replace(/\r?\n+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([`*_{}[\]<>#+.!|])/g, "\\$1")
    .trim();
}

function score(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function bullets(label: string, values: string[]): string[] {
  if (values.length === 0) return [];
  return [`### ${label}`, "", ...values.map((value) => `- ${inline(value)}`), ""];
}

function sectionMarkdown(section: AnalysisSection, fallbackTitle: string): string[] {
  return [
    `## ${inline(section.title || fallbackTitle)}`,
    "",
    inline(section.summary),
    "",
    ...bullets("Strengths", section.strengths ?? []),
    ...bullets("Risks", section.risks ?? []),
    ...bullets("Missing information", section.missing_information ?? []),
    ...bullets("Concerns", section.concerns ?? []),
  ];
}

export function safeReportFilename(title: string, suffix: string): string {
  return safeExportFilename(title, suffix, "md");
}

export function safeExportFilename(title: string, suffix: string, extension: "md" | "json"): string {
  const base = title
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();
  return `${base || "journey"}-${suffix}.${extension}`;
}

function cleanArray(values: string[] | undefined): string[] {
  return (values ?? []).map((value) => String(value).trim()).filter(Boolean);
}

export function buildPrivateReportJson(input: ReportExportInput): string {
  const readiness = input.analysis.dynamic_readiness;
  const sections: PrivateReportJsonV1["sections"] = [];
  for (const [key, fallbackTitle] of SECTION_ORDER) {
    const value = input.analysis[key];
    if (typeof value !== "object" || !value || !("summary" in value)) continue;
    const section = value as AnalysisSection;
    sections.push({
      key,
      title: String(section.title || fallbackTitle).trim(),
      summary: String(section.summary ?? "").trim(),
      strengths: cleanArray(section.strengths),
      risks: cleanArray(section.risks),
      missingInformation: cleanArray(section.missing_information),
      concerns: cleanArray(section.concerns),
    });
  }
  const report: PrivateReportJsonV1 = {
    schema: "redflagdaddy.private-report.v1",
    privacy: {
      audience: "private-owner-export",
      omitted: ["contact details", "raw answers", "share links and access tokens", "generation timestamps"],
    },
    journey: { title: String(input.title).trim(), partnerRole: String(input.participantType).trim() },
    scores: {
      safety: score(input.scores.safety),
      compatibility: score(input.scores.compatibility),
      red: score(input.scores.red),
      green: score(input.scores.green),
      experience: score(input.scores.experience),
    },
    dynamicReadiness: {
      score: score(readiness.score),
      label: String(readiness.label ?? "").trim(),
      rationale: String(readiness.rationale ?? "").trim(),
      strengths: cleanArray(readiness.strengths),
      risks: cleanArray(readiness.risks),
      missingInformation: cleanArray(readiness.missing_information),
      concerns: cleanArray(readiness.concerns),
    },
    sections,
    overallNote: String(input.analysis.overall_note ?? "").trim(),
    disclaimer: DISCLAIMER,
  };
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function buildFullReportMarkdown(input: ReportExportInput): string {
  const lines = [
    "# RedFlagDaddy assessment report",
    "",
    `**Journey:** ${inline(input.title)}`,
    `**Partner role:** ${inline(input.participantType)}`,
    "",
    "> Private export. Store and share it carefully.",
    "",
    "## Scores",
    "",
    `- Safety: ${score(input.scores.safety)} / 100`,
    `- Compatibility: ${score(input.scores.compatibility)} / 100`,
    `- Green flags: ${score(input.scores.green)} / 100`,
    `- Red flags: ${score(input.scores.red)} / 100`,
    `- Experience: ${score(input.scores.experience)} / 100`,
    "",
    "## Dynamic readiness",
    "",
    `**${inline(input.analysis.dynamic_readiness.label)} — ${score(input.analysis.dynamic_readiness.score)} / 100**`,
    "",
    inline(input.analysis.dynamic_readiness.rationale),
    "",
    ...bullets("Strengths", input.analysis.dynamic_readiness.strengths ?? []),
    ...bullets("Risks", input.analysis.dynamic_readiness.risks ?? []),
    ...bullets("Missing information", input.analysis.dynamic_readiness.missing_information ?? []),
    ...bullets("Concerns", input.analysis.dynamic_readiness.concerns ?? []),
  ];

  for (const [key, title] of SECTION_ORDER) {
    const value = input.analysis[key];
    if (typeof value === "object" && value && "summary" in value) {
      lines.push(...sectionMarkdown(value as AnalysisSection, title));
    }
  }

  lines.push(
    "## Overall note",
    "",
    inline(input.analysis.overall_note),
    "",
    "---",
    "",
    DISCLAIMER,
    "",
  );
  return lines.join("\n");
}

export function buildConversationTopicsMarkdown(input: ReportExportInput): string {
  const lines = [
    "# Private conversation topics",
    "",
    "> This selective export intentionally omits scores, readiness labels and the overall report.",
    "",
  ];

  let topicCount = 0;
  for (const [key, fallbackTitle] of SECTION_ORDER) {
    const value = input.analysis[key];
    if (typeof value !== "object" || !value || !("summary" in value)) continue;
    const section = value as AnalysisSection;
    const topics = [
      ...(section.concerns ?? []),
      ...(section.risks ?? []),
      ...(section.missing_information ?? []),
    ].filter((item, index, all) => item.trim() && all.indexOf(item) === index);
    if (topics.length === 0) continue;
    topicCount += topics.length;
    lines.push(`## ${inline(section.title || fallbackTitle)}`, "");
    lines.push(...topics.map((topic) => `- [ ] ${inline(topic)}`), "");
  }

  if (topicCount === 0) lines.push("No specific open topics were identified in this report.", "");
  lines.push("---", "", DISCLAIMER, "");
  return lines.join("\n");
}

export function buildSelectedDimensionsMarkdown(
  input: ReportExportInput,
  selected: SelectableReportDimension[],
): string {
  const allowed = new Set<SelectableReportDimension>(SELECTABLE_REPORT_DIMENSIONS.map(({ key }) => key));
  const unique = selected.filter(
    (key, index, all): key is SelectableReportDimension =>
      allowed.has(key) && all.indexOf(key) === index,
  );
  const lines = [
    "# Selected private report dimensions",
    "",
    "> Selective export. Only the dimensions listed below are included.",
    "",
  ];

  for (const key of unique) {
    const meta = SELECTABLE_REPORT_DIMENSIONS.find((item) => item.key === key);
    const value = input.analysis[key];
    if (!meta || typeof value !== "object" || !value || !("summary" in value)) continue;
    const scoreKey = DIMENSION_SCORE[key];
    lines.push(`## ${inline(meta.label)}`, "");
    if (scoreKey) lines.push(`**Score:** ${score(input.scores[scoreKey])} / 100`, "");
    lines.push(...sectionMarkdown(value as AnalysisSection, meta.label).slice(2));
  }

  if (unique.length === 0) lines.push("No report dimensions were selected.", "");
  lines.push("---", "", DISCLAIMER, "");
  return lines.join("\n");
}

export function buildConversationPlanMarkdown(input: ReportExportInput): string {
  const lines = [
    "# Private conversation plan",
    "",
    "> A preparation aid, not an agreement or proof of consent. Either person can pause, decline or change their mind at any time.",
    "",
    "## Before the conversation",
    "",
    "- [ ] Choose a private time when neither person is rushed, impaired or under pressure.",
    "- [ ] Agree how either person can pause or stop, including a non-verbal option.",
    "- [ ] Confirm that listening and understanding do not automatically mean agreement.",
    "- [ ] Decide what support, space or aftercare may be useful afterwards.",
    "",
    "## Topics to discuss",
    "",
  ];

  let topicCount = 0;
  const seen = new Set<string>();
  for (const [key, fallbackTitle] of SECTION_ORDER) {
    const value = input.analysis[key];
    if (typeof value !== "object" || !value || !("summary" in value)) continue;
    const section = value as AnalysisSection;
    const topics = [
      ...(section.concerns ?? []),
      ...(section.risks ?? []),
      ...(section.missing_information ?? []),
    ]
      .map((item) => item.trim())
      .filter((item, index, all) => item && all.indexOf(item) === index && !seen.has(item));
    if (topics.length === 0) continue;
    lines.push(`### ${inline(section.title || fallbackTitle)}`, "");
    for (const topic of topics) {
      seen.add(topic);
      topicCount += 1;
      lines.push(`- [ ] ${inline(topic)}`);
    }
    lines.push("");
  }

  if (topicCount === 0) {
    lines.push("- [ ] Ask what feels important, uncertain or different since the journey began.", "");
  }

  lines.push(
    "For each topic, ask:",
    "",
    "- What does each person want, not want or remain unsure about?",
    "- Is this a current yes, no, limit, possibility or unresolved question?",
    "- What signs should trigger a check-in, pause or stop?",
    "- What would need to change before revisiting it?",
    "",
    "## Close clearly",
    "",
    "- [ ] Each person restates their own current boundaries and understanding.",
    "- [ ] Mark unresolved topics as unresolved; do not turn uncertainty into agreement.",
    "- [ ] Confirm that any yes applies only to the specific context discussed and remains revocable.",
    "- [ ] If wanted, choose a future check-in without making participation obligatory.",
    "- [ ] Store or delete this private file carefully.",
    "",
    "---",
    "",
    DISCLAIMER,
    "",
  );
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}
