import { describe, expect, it } from "vitest";
import {
  pairInsightCopy,
  pairInsightPriority,
  pairInsightSeverity,
  ruleForCategory,
} from "@/lib/pair-comparison-rules";

describe("pair comparison rules", () => {
  it("treats consent and red-flag gaps as higher priority than generic compatibility gaps", () => {
    const consent = ruleForCategory("Consent & Boundaries");
    const compatibility = ruleForCategory("Compatibility");

    expect(consent.dimension).toBe("consent");
    expect(consent.priorityWeight).toBeGreaterThan(compatibility.priorityWeight);
    expect(
      pairInsightSeverity({ category: "Consent & Boundaries", risk: "critical", scoreGap: 2 }),
    ).toBe("concern");
    expect(
      pairInsightPriority({
        category: "Red Flags",
        risk: "critical",
        scoreGap: 2,
        severity: "concern",
      }),
    ).toBeGreaterThan(
      pairInsightPriority({
        category: "Green Flags",
        risk: "low",
        scoreGap: 2,
        severity: "strength",
      }),
    );
  });

  it("returns category-specific prompts for the report", () => {
    expect(pairInsightCopy({ category: "BDSM Safety", severity: "concern" }).prompt).toContain(
      "safewords",
    );
    expect(pairInsightCopy({ category: "Experience", severity: "watch" }).prompt).toContain(
      "less experienced",
    );
  });
});
