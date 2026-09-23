import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  requireAssignedAssessmentQuestion,
  selectAssessmentQuestions,
  validateAssessmentAnswer,
  visibleAssessmentQuestions,
  type AssessmentQuestion,
} from "./assessment-questions";

const ASSESSMENT_FUNCTIONS_SOURCE = readFileSync(
  new URL("./assessment.functions.ts", import.meta.url),
  "utf8",
);

const ASSESSMENT_ROUTE_SOURCE = readFileSync(
  new URL("../routes/assessment.$code.tsx", import.meta.url),
  "utf8",
);

const LEGACY_REACTIVATION_MIGRATION = readFileSync(
  new URL(
    "../../supabase/migrations/20260916143000_reactivate_curated_legacy_question_pool.sql",
    import.meta.url,
  ),
  "utf8",
);

const QUESTION_ASSIGNMENT_MIGRATION = readFileSync(
  new URL(
    "../../supabase/migrations/20260920211500_persist_assessment_question_sets.sql",
    import.meta.url,
  ),
  "utf8",
);

function curatedQuestions(): AssessmentQuestion[] {
  const migration = readFileSync(
    new URL(
      "../../supabase/migrations/20260915203000_curated_assessment_bank.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const rowPattern =
    /\('([^']+)', '((?:[^']|'')*)', '([^']+)'::public\.question_type, '(.*?)'::jsonb, (\d+), '([^']+)'::public\.risk_level, (\d+), '\{\}'::jsonb, ARRAY\[(.*?)\]::text\[\]\)/g;
  return Array.from(migration.matchAll(rowPattern), (match) => {
    const [, category, text, questionType, options, weight, risk, orderIndex, roleList] = match;
    return {
      id: orderIndex,
      category_id: category,
      question_categories: { name: category },
      question: text.replaceAll("''", "'"),
      question_type: questionType,
      answer_options: JSON.parse(options.replaceAll("''", "'")),
      weight: Number(weight),
      risk_level: risk,
      order_index: Number(orderIndex),
      branch_logic: {},
      applies_to: roleList.split(",").map((role) => role.trim().replaceAll("'", "")),
    };
  });
}

function question(id: string, overrides: Partial<AssessmentQuestion> = {}): AssessmentQuestion {
  return {
    id,
    category_id: "category-a",
    question: `Question ${id}`,
    question_type: "single_choice",
    answer_options: [
      { label: "Yes", value: "yes", score: 1 },
      { label: "No", value: "no", score: 0 },
    ],
    weight: 1,
    risk_level: "low",
    order_index: Number(id),
    branch_logic: {},
    ...overrides,
  };
}

describe("assessment question integrity", () => {
  it("saves progress in an explicit batch instead of after every answer", () => {
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain("export const saveResponses");
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain(
      '.upsert(rows, { onConflict: "journey_id,question_id" })',
    );
    expect(ASSESSMENT_ROUTE_SOURCE).toContain("saveAndExitMutation");
    expect(ASSESSMENT_ROUTE_SOURCE).toContain("await saveFn");
    expect(ASSESSMENT_ROUTE_SOURCE).not.toContain("saveMutation.mutateAsync");
  });

  it("selects the same bounded set for the same journey", () => {
    const questions = Array.from({ length: 12 }, (_, index) =>
      question(String(index + 1), {
        category_id: index % 2 === 0 ? "category-a" : "category-b",
      }),
    );

    const first = selectAssessmentQuestions(questions, 6, "journey-1");
    const second = selectAssessmentQuestions(questions, 6, "journey-1");

    expect(first.map(({ id }) => id)).toEqual(second.map(({ id }) => id));
    expect(first).toHaveLength(6);
  });

  it("handles more categories than the assessment limit", () => {
    const questions = Array.from({ length: 12 }, (_, index) =>
      question(String(index + 1), { category_id: `category-${index}` }),
    );

    expect(selectAssessmentQuestions(questions, 5, "journey-1")).toHaveLength(5);
  });

  it("prioritizes the intended spread when a short test has more categories than slots", () => {
    const categoryNames = [
      "Financial Responsibility",
      "Community Involvement",
      "Consent",
      "Safety Practices",
      "Boundaries",
      "Communication",
      "Trust",
      "Aftercare",
    ];
    const questions = categoryNames.map((name, index) =>
      question(String(index + 1), {
        category_id: `category-${index}`,
        question_categories: { name },
      }),
    );

    const selected = selectAssessmentQuestions(questions, 4, "journey-1");

    expect(selected.map((item) => item.question_categories?.name).sort()).toEqual([
      "Boundaries",
      "Communication",
      "Consent",
      "Safety Practices",
    ]);
  });

  it("keeps quick assessments balanced instead of over-picking one high-risk category", () => {
    const categories = [
      "Consent & Boundaries",
      "BDSM Safety",
      "Communication",
      "Compatibility",
      "Red Flags",
      "Green Flags",
      "Experience",
    ];
    const questions = categories.flatMap((name, categoryIndex) =>
      Array.from({ length: name === "Red Flags" ? 60 : 20 }, (_, index) =>
        question(`${categoryIndex + 1}${String(index + 1).padStart(2, "0")}`, {
          category_id: `category-${categoryIndex}`,
          question_categories: { name },
          risk_level: name === "Red Flags" ? "critical" : "low",
          weight: name === "Red Flags" ? 8 : 1,
          order_index: categoryIndex * 100 + index,
        }),
      ),
    );

    const selected = selectAssessmentQuestions(questions, 50, "journey-1");
    const counts = selected.reduce<Record<string, number>>((acc, item) => {
      const name = item.question_categories?.name ?? "Other";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

    expect(selected).toHaveLength(50);
    expect(counts["Consent & Boundaries"]).toBeGreaterThanOrEqual(8);
    expect(counts["BDSM Safety"]).toBeGreaterThanOrEqual(8);
    expect(counts["Red Flags"]).toBeLessThanOrEqual(8);
    expect(counts["Experience"]).toBeGreaterThanOrEqual(1);
  });

  it("balances custom journeys evenly across selected categories with unequal pool sizes", () => {
    const questions = [
      ...Array.from({ length: 30 }, (_, index) =>
        question(`a-${index}`, {
          category_id: "category-a",
          question_categories: { name: "Consent" },
          order_index: index,
        }),
      ),
      ...Array.from({ length: 12 }, (_, index) =>
        question(`b-${index}`, {
          category_id: "category-b",
          question_categories: { name: "Communication" },
          order_index: 100 + index,
        }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        question(`c-${index}`, {
          category_id: "category-c",
          question_categories: { name: "Attachment Style" },
          order_index: 200 + index,
        }),
      ),
    ];

    const selected = selectAssessmentQuestions(questions, 15, "custom-journey", "equal");
    const counts = selected.reduce<Record<string, number>>((acc, item) => {
      acc[item.category_id] = (acc[item.category_id] ?? 0) + 1;
      return acc;
    }, {});

    expect(selected).toHaveLength(15);
    expect(counts).toEqual({
      "category-a": 5,
      "category-b": 5,
      "category-c": 5,
    });
  });

  it("varies the questions between journeys while remaining stable within one journey", () => {
    const questions = Array.from({ length: 30 }, (_, index) =>
      question(String(index + 1), {
        category_id: index < 15 ? "category-a" : "category-b",
      }),
    );

    const first = selectAssessmentQuestions(questions, 10, "journey-a", "equal");
    const repeated = selectAssessmentQuestions(questions, 10, "journey-a", "equal");
    const second = selectAssessmentQuestions(questions, 10, "journey-b", "equal");

    expect(first.map(({ id }) => id)).toEqual(repeated.map(({ id }) => id));
    expect(first.map(({ id }) => id)).not.toEqual(second.map(({ id }) => id));
  });

  it("persists and mirrors one exact question set for paired assessments", () => {
    expect(QUESTION_ASSIGNMENT_MIGRATION).toContain("assigned_question_ids uuid[]");
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain('journeySettings.pair_side === "owner"');
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain('.select("partner_journey_id")');
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain("sourceSettings.assigned_question_ids");
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain("mirror paired question set");
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain("sourceSettings.id,");
  });

  it("keeps the curated migration at exactly 100 active, tagged questions", () => {
    const questions = curatedQuestions();
    const categoryCounts = questions.reduce<Record<string, number>>((acc, item) => {
      const name = item.question_categories?.name ?? "Other";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

    expect(questions).toHaveLength(100);
    expect(Object.keys(categoryCounts)).toHaveLength(20);
    expect(new Set(Object.values(categoryCounts))).toEqual(new Set([5]));
    expect(questions.every((item) => (item.applies_to ?? []).length > 0)).toBe(true);
    expect(questions.every((item) => item.question.trim().length > 20)).toBe(true);
  });

  it("builds a broad quick test from the curated bank instead of one category cluster", () => {
    const selected = selectAssessmentQuestions(curatedQuestions(), 15, "quick-regression");
    const categories = new Set(selected.map((item) => item.question_categories?.name));
    const risks = new Set(selected.map((item) => item.risk_level));

    expect(selected).toHaveLength(15);
    expect(categories.size).toBeGreaterThanOrEqual(12);
    expect(categories.has("Consent")).toBe(true);
    expect(categories.has("Boundaries")).toBe(true);
    expect(categories.has("Communication")).toBe(true);
    expect(categories.has("Safety Practices")).toBe(true);
    expect(categories.has("Dominant Skills") || categories.has("Submissive Skills")).toBe(true);
    expect(risks.has("critical")).toBe(true);
    expect(risks.has("high")).toBe(true);
  });

  it("builds a broad 50-question test from the curated bank", () => {
    const selected = selectAssessmentQuestions(curatedQuestions(), 50, "full-regression");
    const counts = selected.reduce<Record<string, number>>((acc, item) => {
      const name = item.question_categories?.name ?? "Other";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

    expect(selected).toHaveLength(50);
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(18);
    expect(counts.Consent).toBeGreaterThanOrEqual(3);
    expect(counts.Boundaries).toBeGreaterThanOrEqual(3);
    expect(counts.Communication).toBeGreaterThanOrEqual(3);
    expect(counts["Safety Practices"]).toBeGreaterThanOrEqual(3);
    expect(counts["Red Flags"]).toBeLessThanOrEqual(4);
  });

  it("keeps role-specific skill questions off the wrong broad side", () => {
    const questions = curatedQuestions();
    const dominantPack = questions.filter((item) => {
      const roles = item.applies_to ?? [];
      return roles.includes("Dominant") && item.question_categories?.name !== "Submissive Skills";
    });
    const submissivePack = questions.filter((item) => {
      const roles = item.applies_to ?? [];
      return roles.includes("submissive") && item.question_categories?.name !== "Dominant Skills";
    });

    expect(dominantPack).toHaveLength(95);
    expect(submissivePack).toHaveLength(95);
    expect(dominantPack.some((item) => item.question_categories?.name === "Dominant Skills")).toBe(
      true,
    );
    expect(
      submissivePack.some((item) => item.question_categories?.name === "Submissive Skills"),
    ).toBe(true);
    expect(
      dominantPack.some((item) => item.question_categories?.name === "Submissive Skills"),
    ).toBe(false);
    expect(
      submissivePack.some((item) => item.question_categories?.name === "Dominant Skills"),
    ).toBe(false);
  });

  it("uses archetype-specific tags for specialist roles", () => {
    const questions = curatedQuestions();
    const allTags = new Set(questions.flatMap((item) => item.applies_to ?? []));

    for (const role of [
      "Master",
      "sadist",
      "rope top",
      "service top",
      "degradation giver",
      "slave",
      "brat",
      "little",
      "pet",
      "masochist",
      "rope bottom",
      "service bottom",
      "degradation receiver",
      "primal",
      "caregiver",
      "exhibitionist",
      "voyeur",
    ]) {
      expect(allTags.has(role)).toBe(true);
    }
  });

  it("does not count safe red-flag answers as red-flag score", () => {
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain('case "red":');
    expect(ASSESSMENT_FUNCTIONS_SOURCE).toContain("if (s < 0) redRaw += Math.abs(s);");
    expect(ASSESSMENT_FUNCTIONS_SOURCE).not.toContain("if (s > 0) redRaw += s");
  });

  it("reactivates only a vetted legacy extension pool", () => {
    const values = Array.from(
      LEGACY_REACTIVATION_MIGRATION.matchAll(/\('((?:[^']|'')*)'\)(?:,| --)/g),
      (match) => match[1].replaceAll("''", "'"),
    );

    expect(values).toHaveLength(71);
    expect(LEGACY_REACTIVATION_MIGRATION).toContain("SET active = true");
    const selectedText = values.join("\n");
    expect(selectedText).not.toMatch(/my partner|does your partner/i);
    expect(selectedText).not.toMatch(/loan or credit card|missed a utility bill/i);
  });

  it("applies branch skips consistently", () => {
    const questions = [
      question("1", {
        branch_logic: { if: [{ answer: "no", goto_order: 4 }] },
      }),
      question("2"),
      question("3"),
      question("4"),
    ];

    expect(visibleAssessmentQuestions(questions, { "1": "no" }).map(({ id }) => id)).toEqual([
      "1",
      "4",
    ]);
  });

  it("rejects forged choice values and out-of-range scores", () => {
    expect(() => validateAssessmentAnswer(question("1"), "forged")).toThrow("available answers");
    expect(() =>
      validateAssessmentAnswer(question("2", { question_type: "scale", answer_options: [] }), 1000),
    ).toThrow("1 to 10");
  });

  it("rejects a question that was not assigned to the assessment", () => {
    expect(() => requireAssignedAssessmentQuestion([question("1")], "forged-id")).toThrow(
      "not part of this assessment",
    );
  });

  it("accepts valid choice, multi-choice, scale, slider and text answers", () => {
    expect(() => validateAssessmentAnswer(question("1"), "yes")).not.toThrow();
    expect(() =>
      validateAssessmentAnswer(question("2", { question_type: "multi_choice" }), ["yes", "no"]),
    ).not.toThrow();
    expect(() =>
      validateAssessmentAnswer(question("3", { question_type: "scale", answer_options: [] }), 7),
    ).not.toThrow();
    expect(() =>
      validateAssessmentAnswer(
        question("4", {
          question_type: "slider",
          answer_options: [{ min: 20, max: 40 }],
        }),
        30,
      ),
    ).not.toThrow();
    expect(() =>
      validateAssessmentAnswer(
        question("5", { question_type: "text", answer_options: [] }),
        "A considered answer",
      ),
    ).not.toThrow();
  });
});
