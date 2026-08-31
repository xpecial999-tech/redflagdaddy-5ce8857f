import { describe, expect, it } from "vitest";
import type { AnalysisPayload } from "./analysis.functions";
import {
  buildConversationTopicsMarkdown,
  buildConversationPlanMarkdown,
  buildFullReportMarkdown,
  buildPrivateReportJson,
  buildSelectedDimensionsMarkdown,
  safeExportFilename,
  safeReportFilename,
} from "./report-export";

const section = {
  title: "Consent & check-ins",
  summary: "Discuss check-in expectations.",
  strengths: ["Clear stop language"],
  risks: ["Different check-in frequency"],
  missing_information: ["Non-verbal pause signal"],
  concerns: ["Old agreement may be stale"],
};

const analysis: AnalysisPayload = {
  safety: section, compatibility: section, red_flags: section, green_flags: section,
  communication: section, consent: section,
  dynamic_readiness: {
    score: 63.6, label: "Developing", rationale: "More discussion is useful.",
    strengths: [], risks: [], missing_information: [], concerns: [],
  },
  overall_note: "Keep communicating.",
  generated_at: "2026-08-26T20:00:00.000Z",
};

const input = {
  title: "First / private journey",
  participantType: "switch",
  scores: { safety: 71, compatibility: 62, red: 18, green: 75, experience: 48 },
  analysis,
};

describe("privacy-first report exports", () => {
  it("builds a full private report with bounded scores and a safety boundary", () => {
    const markdown = buildFullReportMarkdown(input);
    expect(markdown).toContain("Safety: 71 / 100");
    expect(markdown).toContain("Developing — 64 / 100");
    expect(markdown).toContain("not identity verification");
    expect(markdown).not.toContain(analysis.generated_at);
  });

  it("builds a selective topics export without scores or readiness", () => {
    const markdown = buildConversationTopicsMarkdown(input);
    expect(markdown).toContain("- [ ] Different check-in frequency");
    expect(markdown).toContain("- [ ] Non-verbal pause signal");
    expect(markdown).not.toContain("Safety: 71");
    expect(markdown).not.toContain("Developing");
    expect(markdown).not.toContain("Keep communicating");
    expect(markdown).not.toContain(input.title);
  });

  it("builds a non-diagnostic conversation plan from open topics", () => {
    const markdown = buildConversationPlanMarkdown(input);
    expect(markdown).toContain("# Private conversation plan");
    expect(markdown).toContain("- [ ] Different check-in frequency");
    expect(markdown).toContain("listening and understanding do not automatically mean agreement");
    expect(markdown).toContain("not an agreement or proof of consent");
    expect(markdown).not.toContain("Safety: 71");
    expect(markdown).not.toContain("Keep communicating");
    expect(markdown).not.toContain(analysis.generated_at);
    expect(markdown).not.toContain(input.title);
    expect(markdown).not.toContain(input.participantType);
  });

  it("exports only explicitly selected report dimensions", () => {
    const markdown = buildSelectedDimensionsMarkdown(input, ["safety", "communication"]);
    expect(markdown).toContain("## Safety");
    expect(markdown).toContain("**Score:** 71 / 100");
    expect(markdown).toContain("## Communication");
    expect(markdown).not.toContain("## Potential red flags");
    expect(markdown).not.toContain("Red flags: 18");
    expect(markdown).not.toContain("Dynamic readiness");
    expect(markdown).not.toContain("Keep communicating");
    expect(markdown).not.toContain(analysis.generated_at);
    expect(markdown).not.toContain(input.title);
  });

  it("creates a filesystem-safe filename", () => {
    expect(safeReportFilename(input.title, "private-report")).toBe(
      "first-private-journey-private-report.md",
    );
    expect(safeExportFilename(input.title, "private-report", "json")).toBe(
      "first-private-journey-private-report.json",
    );
  });

  it("builds a versioned private JSON export without operational or access data", () => {
    const report = JSON.parse(buildPrivateReportJson(input));
    expect(report.schema).toBe("redflagdaddy.private-report.v1");
    expect(report.scores.safety).toBe(71);
    expect(report.dynamicReadiness.score).toBe(64);
    expect(report.sections[0]).toMatchObject({ key: "safety", title: "Consent & check-ins" });
    expect(report.disclaimer).toContain("not identity verification");
    expect(JSON.stringify(report)).not.toContain(analysis.generated_at);
    expect(report.token).toBeUndefined();
    expect(report.shareUrl).toBeUndefined();
  });
});
