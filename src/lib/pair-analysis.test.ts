import { describe, expect, it } from "vitest";
import { buildPairAnalysis } from "@/lib/pair-analysis";
import { parsePairAnalysisPayload } from "@/lib/analysis.functions";

describe("pair analysis", () => {
  it("builds a structured pair comparison from two completed sides", () => {
    const analysis = buildPairAnalysis({
      owner: {
        journeyId: "owner",
        title: "My side",
        role: "Dominant",
        scores: { safety: 80, compatibility: 72, red: 15, green: 85, experience: 55 },
      },
      partner: {
        journeyId: "partner",
        title: "Partner side",
        role: "submissive",
        scores: { safety: 48, compatibility: 68, red: 62, green: 74, experience: 30 },
      },
      matches: [
        {
          question: "How do you respond when a safeword is used?",
          category: "Consent",
          risk: "critical",
          ownerAnswer: "Stop immediately and check in.",
          partnerAnswer: "I worry it may disappoint them.",
          ownerScore: -1,
          partnerScore: 5,
        },
      ],
    });

    expect(parsePairAnalysisPayload(analysis)).not.toBeNull();
    expect(analysis.kind).toBe("pair_comparison");
    expect(analysis.overall.score).toBeGreaterThanOrEqual(0);
    expect(analysis.overall.score).toBeLessThanOrEqual(100);
    expect(analysis.question_insights[0]?.severity).toBe("concern");
    expect(analysis.watchouts.length).toBeGreaterThan(0);
  });
});
