import { describe, expect, it } from "vitest";
import type { AnalysisPayload } from "./analysis.functions";
import {
  buildCalendarInvite,
  collectConversationTopics,
  topicsCalendarDescription,
} from "./calendar-invite";

const section = {
  title: "Consent",
  summary: "Summary",
  strengths: [],
  risks: ["Agree on check-in frequency"],
  missing_information: ["Choose a non-verbal pause signal"],
  concerns: ["Review changed limits"],
};
const analysis: AnalysisPayload = {
  safety: section,
  compatibility: section,
  red_flags: section,
  green_flags: section,
  communication: section,
  consent: section,
  dynamic_readiness: {
    score: 50,
    label: "Developing",
    rationale: "Private rationale",
    strengths: [], risks: [], missing_information: [], concerns: [],
  },
  overall_note: "Private overall note",
  generated_at: "2026-08-27T05:00:00Z",
};

describe("private calendar invites", () => {
  it("creates a discreet event without product or journey content by default", () => {
    const invite = buildCalendarInvite({
      title: "Private conversation",
      start: new Date("2026-08-29T17:00:00Z"),
      durationMinutes: 60,
      uid: "test@redflagdaddy.com",
      createdAt: new Date("2026-08-27T05:00:00Z"),
    });
    expect(invite).toContain("SUMMARY:Private conversation");
    expect(invite).toContain("DTEND:20260829T180000Z");
    expect(invite).not.toContain("DESCRIPTION:");
    expect(invite).not.toContain("Private overall note");
  });

  it("includes only bounded, deduplicated topics when explicitly requested", () => {
    const topics = collectConversationTopics(analysis);
    expect(topics).toEqual([
      "Review changed limits",
      "Agree on check-in frequency",
      "Choose a non-verbal pause signal",
    ]);
    const description = topicsCalendarDescription(topics);
    expect(description).toContain("Review changed limits");
    expect(description).not.toContain("Private rationale");
  });

  it("escapes calendar control characters and clamps duration", () => {
    const invite = buildCalendarInvite({
      title: "Check-in\r\nATTENDEE:bad@example.com",
      description: "One, two; three",
      start: new Date("2026-08-29T17:00:00Z"),
      durationMinutes: 999,
      uid: "safe@example.com",
      createdAt: new Date("2026-08-27T05:00:00Z"),
    });
    expect(invite).toContain("SUMMARY:Check-in ATTENDEE:bad@example.com");
    expect(invite).toContain("DESCRIPTION:One\\, two\\; three");
    expect(invite).toContain("DTEND:20260829T210000Z");
    expect(invite.match(/ATTENDEE:/g)).toHaveLength(1);
  });
});
