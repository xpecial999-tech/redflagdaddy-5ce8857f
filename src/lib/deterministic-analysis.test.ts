import { describe, expect, it } from "vitest";
import { parseAnalysisPayload } from "@/lib/analysis.functions";
import { buildDeterministicAnalysis } from "@/lib/deterministic-analysis";

describe("deterministic analysis", () => {
  it("builds a complete report payload without an external model", () => {
    const analysis = buildDeterministicAnalysis(
      {
        safety_score: 42,
        compatibility_score: 67,
        red_flag_score: 72,
        green_flag_score: 81,
        experience_score: 30,
      },
      {
        "Red Flags": {
          total: 2,
          topRisk: [
            {
              q: "How do you respond when a safeword is used?",
              a: "I sometimes need convincing.",
              risk: "critical",
              score: 5,
            },
          ],
        },
        "Green Flags": {
          total: 1,
          topRisk: [
            {
              q: "How do you plan aftercare?",
              a: "I agree check-ins before and after.",
              risk: "low",
              score: 4,
            },
          ],
        },
      },
    );

    expect(parseAnalysisPayload(analysis)).not.toBeNull();
    expect(analysis.red_flags.summary).toContain("serious");
    expect(analysis.red_flags.concerns.length).toBeGreaterThan(0);
    expect(analysis.dynamic_readiness.score).toBeGreaterThanOrEqual(0);
    expect(analysis.dynamic_readiness.score).toBeLessThanOrEqual(100);
  });
});
