import { describe, expect, it } from "vitest";
import {
  requireAssignedAssessmentQuestion,
  selectAssessmentQuestions,
  validateAssessmentAnswer,
  visibleAssessmentQuestions,
  type AssessmentQuestion,
} from "./assessment-questions";

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
