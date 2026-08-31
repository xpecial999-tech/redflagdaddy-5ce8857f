import type { AnalysisPayload, AnalysisSection } from "@/lib/analysis.functions";

type CalendarInviteInput = {
  title: string;
  start: Date;
  durationMinutes: number;
  description?: string;
  uid: string;
  createdAt?: Date;
};

const TOPIC_SECTIONS: Array<keyof AnalysisPayload> = [
  "consent",
  "safety",
  "communication",
  "compatibility",
  "red_flags",
];

function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .trim();
}

function icsDate(value: Date): string {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function safeDuration(value: number): number {
  if (!Number.isFinite(value)) return 60;
  return Math.max(15, Math.min(240, Math.round(value)));
}

export function collectConversationTopics(analysis: AnalysisPayload, limit = 12): string[] {
  const topics: string[] = [];
  for (const key of TOPIC_SECTIONS) {
    const value = analysis[key];
    if (typeof value !== "object" || !value || !("summary" in value)) continue;
    const section = value as AnalysisSection;
    for (const item of [
      ...(section.concerns ?? []),
      ...(section.risks ?? []),
      ...(section.missing_information ?? []),
    ]) {
      const normalized = item.replace(/\s+/g, " ").trim().slice(0, 180);
      if (normalized && !topics.includes(normalized)) topics.push(normalized);
      if (topics.length >= limit) return topics;
    }
  }
  return topics;
}

export function topicsCalendarDescription(topics: string[]): string {
  if (topics.length === 0) return "";
  return ["Private discussion topics:", ...topics.map((topic) => `- ${topic}`)].join("\n");
}

export function buildCalendarInvite(input: CalendarInviteInput): string {
  if (!Number.isFinite(input.start.getTime())) throw new Error("Invalid calendar start time");
  const createdAt = input.createdAt ?? new Date();
  if (!Number.isFinite(createdAt.getTime())) throw new Error("Invalid calendar creation time");
  const end = new Date(input.start.getTime() + safeDuration(input.durationMinutes) * 60_000);
  const title = input.title.replace(/\s+/g, " ").trim().slice(0, 100) || "Private conversation";
  const uid = input.uid.replace(/[^a-zA-Z0-9@._-]/g, "").slice(0, 180);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RedFlagDaddy//Private Conversation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid || "private-conversation@redflagdaddy.com"}`,
    `DTSTAMP:${icsDate(createdAt)}`,
    `DTSTART:${icsDate(input.start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`,
  ];
  if (input.description?.trim()) lines.push(`DESCRIPTION:${icsText(input.description.slice(0, 2500))}`);
  lines.push("TRANSP:OPAQUE", "END:VEVENT", "END:VCALENDAR", "");
  return lines.join("\r\n");
}

export function downloadCalendarInvite(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}
