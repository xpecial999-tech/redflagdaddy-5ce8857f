export type AnswerOption = {
  label: string;
  value: string;
  score?: number;
};

export type AssessmentQuestion = {
  id: string;
  category_id: string;
  question: string;
  question_type: string;
  answer_options: Json;
  weight: number | string;
  risk_level: string;
  order_index: number;
  branch_logic: Json;
  applies_to?: string[];
};

type BranchRule = { answer: string; goto_order: number };

const RISK_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectAssessmentQuestions<
  T extends Pick<AssessmentQuestion, "id" | "category_id" | "weight" | "risk_level">,
>(questions: T[], limit: number, seedKey: string): T[] {
  if (questions.length <= limit) return questions;

  const byCategory = new Map<string, T[]>();
  for (const question of questions) {
    const category = byCategory.get(question.category_id) ?? [];
    category.push(question);
    byCategory.set(question.category_id, category);
  }

  const random = mulberry32(seedFromString(seedKey));
  const sortedByCategory = new Map<string, T[]>();
  for (const [categoryId, categoryQuestions] of byCategory) {
    const ranked = categoryQuestions.map((question) => ({
      question,
      score: (Number(question.weight) || 1) * 10 + (RISK_RANK[question.risk_level] ?? 1),
      random: random(),
    }));
    ranked.sort((left, right) => right.score - left.score || left.random - right.random);
    sortedByCategory.set(
      categoryId,
      ranked.map(({ question }) => question),
    );
  }

  if (sortedByCategory.size >= limit) {
    return Array.from(sortedByCategory.values())
      .slice(0, limit)
      .map((categoryQuestions) => categoryQuestions[0]);
  }

  const allocations = new Map<string, number>();
  let allocated = 0;
  for (const [categoryId, categoryQuestions] of sortedByCategory) {
    const count = Math.max(1, Math.floor((categoryQuestions.length / questions.length) * limit));
    allocations.set(categoryId, Math.min(count, categoryQuestions.length));
    allocated += allocations.get(categoryId) ?? 0;
  }

  const categoryIds = Array.from(sortedByCategory.keys());
  while (allocated > limit) {
    const categoryId = categoryIds[Math.floor(random() * categoryIds.length)];
    if ((allocations.get(categoryId) ?? 0) > 1) {
      allocations.set(categoryId, (allocations.get(categoryId) ?? 0) - 1);
      allocated--;
    }
  }
  while (allocated < limit) {
    const categoryId = categoryIds[Math.floor(random() * categoryIds.length)];
    const current = allocations.get(categoryId) ?? 0;
    if (current < (sortedByCategory.get(categoryId)?.length ?? 0)) {
      allocations.set(categoryId, current + 1);
      allocated++;
    }
  }

  const selected: T[] = [];
  for (const [categoryId, count] of allocations) {
    selected.push(...(sortedByCategory.get(categoryId) ?? []).slice(0, count));
  }
  return selected;
}

function branchRules(branchLogic: unknown): BranchRule[] {
  if (!branchLogic || typeof branchLogic !== "object") return [];
  const rules = (branchLogic as { if?: unknown }).if;
  if (!Array.isArray(rules)) return [];
  return rules.filter(
    (rule): rule is BranchRule =>
      Boolean(rule) &&
      typeof rule === "object" &&
      typeof (rule as BranchRule).answer === "string" &&
      Number.isFinite((rule as BranchRule).goto_order),
  );
}

export function hasAssessmentAnswer(answer: unknown): boolean {
  return (
    answer !== undefined && answer !== null && !(typeof answer === "string" && answer.trim() === "")
  );
}

export function requireAssignedAssessmentQuestion<T extends Pick<AssessmentQuestion, "id">>(
  questions: T[],
  questionId: string,
): T {
  const question = questions.find(({ id }) => id === questionId);
  if (!question) {
    throw new Error("Question is not part of this assessment.");
  }
  return question;
}

export function visibleAssessmentQuestions<T extends AssessmentQuestion>(
  questions: T[],
  answers: Record<string, unknown>,
): T[] {
  const ordered = [...questions].sort((left, right) => left.order_index - right.order_index);
  const skippedOrders = new Set<number>();

  for (const question of ordered) {
    const answer = answers[question.id];
    for (const rule of branchRules(question.branch_logic)) {
      if (hasAssessmentAnswer(answer) && String(answer) === rule.answer) {
        for (const candidate of ordered) {
          if (
            candidate.order_index > question.order_index &&
            candidate.order_index < rule.goto_order
          ) {
            skippedOrders.add(candidate.order_index);
          }
        }
      }
    }
  }

  return ordered.filter((question) => !skippedOrders.has(question.order_index));
}

function answerOptions(value: unknown): AnswerOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (option): option is AnswerOption =>
      Boolean(option) &&
      typeof option === "object" &&
      typeof (option as AnswerOption).label === "string" &&
      typeof (option as AnswerOption).value === "string",
  );
}

function sliderBounds(value: unknown) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const config =
    candidate && typeof candidate === "object"
      ? (candidate as { min?: unknown; max?: unknown })
      : {};
  const min = Number(config.min);
  const max = Number(config.max);
  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 100,
  };
}

export function validateAssessmentAnswer(
  question: Pick<AssessmentQuestion, "question_type" | "answer_options">,
  answer: unknown,
): void {
  if (!hasAssessmentAnswer(answer)) {
    throw new Error("An answer is required.");
  }

  const options = answerOptions(question.answer_options);
  const optionValues = new Set(options.map((option) => option.value));

  switch (question.question_type) {
    case "single_choice":
    case "boolean":
    case "scenario":
      if (typeof answer !== "string" || !optionValues.has(answer)) {
        throw new Error("Select one of the available answers.");
      }
      return;
    case "multi_choice":
      if (
        !Array.isArray(answer) ||
        answer.some((value) => typeof value !== "string" || !optionValues.has(value)) ||
        new Set(answer).size !== answer.length
      ) {
        throw new Error("Select only available answers.");
      }
      return;
    case "scale":
      if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 1 || answer > 10) {
        throw new Error("Select a value from 1 to 10.");
      }
      return;
    case "slider": {
      const { min, max } = sliderBounds(question.answer_options);
      if (
        typeof answer !== "number" ||
        !Number.isFinite(answer) ||
        answer < Math.min(min, max) ||
        answer > Math.max(min, max)
      ) {
        throw new Error("Select a value within the available range.");
      }
      return;
    }
    case "text":
      if (typeof answer !== "string" || answer.trim() === "") {
        throw new Error("Enter an answer before continuing.");
      }
      return;
    default:
      throw new Error("This question type is not supported.");
  }
}
import type { Json } from "@/integrations/supabase/types";
