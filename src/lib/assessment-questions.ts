export type AnswerOption = {
  label: string;
  value: string;
  score?: number;
};

export type AssessmentQuestion = {
  id: string;
  category_id: string;
  question_categories?: { name: string } | null;
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

const CATEGORY_BALANCE: Record<string, number> = {
  Consent: 0.08,
  Boundaries: 0.075,
  Communication: 0.075,
  "Safety Practices": 0.075,
  "Red Flags": 0.055,
  Aftercare: 0.06,
  Trust: 0.06,
  "Relationship Goals": 0.06,
  "Power Exchange": 0.05,
  Accountability: 0.05,
  "Conflict Resolution": 0.05,
  "Emotional Intelligence": 0.05,
  "Green Flags": 0.05,
  "BDSM Experience": 0.04,
  "Dominant Skills": 0.065,
  "Submissive Skills": 0.065,
  "Financial Responsibility": 0.03,
  "Attachment Style": 0.03,
  "Community Involvement": 0.03,
  "BDSM Safety": 0.08,
  "Consent & Boundaries": 0.09,
  "Consent & Communication": 0.08,
  Compatibility: 0.06,
  Experience: 0.04,
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
  T extends Pick<AssessmentQuestion, "id" | "category_id" | "weight" | "risk_level"> &
    Partial<Pick<AssessmentQuestion, "question_categories" | "order_index">>,
>(questions: T[], limit: number, seedKey: string): T[] {
  const byOrder = (left: T, right: T) =>
    (Number(left.order_index) || 0) - (Number(right.order_index) || 0) ||
    left.id.localeCompare(right.id);

  if (questions.length <= limit) return [...questions].sort(byOrder);

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
      // Keep quick packs broad and human-feeling. Weight/risk still nudges the
      // sample, but it must not dominate it; otherwise each category becomes a
      // wall of near-duplicate critical consent/safety questions.
      score:
        random() +
        Math.min(Number(question.weight) || 1, 5) * 0.025 +
        (RISK_RANK[question.risk_level] ?? 1) * 0.02,
      random: random(),
    }));
    ranked.sort((left, right) => right.score - left.score || left.random - right.random);
    sortedByCategory.set(
      categoryId,
      ranked.map(({ question }) => question),
    );
  }

  if (sortedByCategory.size >= limit) {
    return Array.from(sortedByCategory.entries())
      .sort((left, right) => {
        const leftName = left[1][0]?.question_categories?.name;
        const rightName = right[1][0]?.question_categories?.name;
        return (
          (rightName ? (CATEGORY_BALANCE[rightName] ?? 0) : 0) -
            (leftName ? (CATEGORY_BALANCE[leftName] ?? 0) : 0) ||
          left[0].localeCompare(right[0])
        );
      })
      .slice(0, limit)
      .map(([, categoryQuestions]) => categoryQuestions[0])
      .sort(byOrder);
  }

  const desiredCategoryShare = (categoryId: string) => {
    const categoryName = sortedByCategory.get(categoryId)?.[0]?.question_categories?.name;
    return categoryName ? (CATEGORY_BALANCE[categoryName] ?? 0) : 0;
  };

  const planned = Array.from(sortedByCategory, ([categoryId, categoryQuestions]) => {
    const desiredShare = desiredCategoryShare(categoryId);
    const priority = desiredShare || categoryQuestions.length / questions.length;
    const exact = priority * limit;
    const count = Math.max(1, Math.floor(exact));
    return {
      categoryId,
      capacity: categoryQuestions.length,
      count: Math.min(count, categoryQuestions.length),
      exact,
      priority,
      remainder: exact - Math.floor(exact),
    };
  });
  const allocations = new Map(planned.map(({ categoryId, count }) => [categoryId, count]));
  let allocated = planned.reduce((sum, { count }) => sum + count, 0);

  const categoryIds = Array.from(sortedByCategory.keys()).sort((left, right) => {
    const balance = desiredCategoryShare(right) - desiredCategoryShare(left);
    const size =
      (sortedByCategory.get(right)?.length ?? 0) - (sortedByCategory.get(left)?.length ?? 0);
    return balance || size || left.localeCompare(right);
  });
  while (allocated > limit) {
    const categoryId = planned
      .filter(({ categoryId }) => (allocations.get(categoryId) ?? 0) > 1)
      .sort(
        (left, right) =>
          left.remainder - right.remainder ||
          left.priority - right.priority ||
          left.categoryId.localeCompare(right.categoryId),
      )[0]?.categoryId;
    if (!categoryId) break;
    allocations.set(categoryId, (allocations.get(categoryId) ?? 0) - 1);
    allocated--;
  }
  while (allocated < limit) {
    const categoryId = planned
      .filter(({ categoryId, capacity }) => (allocations.get(categoryId) ?? 0) < capacity)
      .sort((left, right) => {
        const leftDeficit = left.exact - (allocations.get(left.categoryId) ?? 0);
        const rightDeficit = right.exact - (allocations.get(right.categoryId) ?? 0);
        return (
          rightDeficit - leftDeficit ||
          right.remainder - left.remainder ||
          right.priority - left.priority ||
          categoryIds.indexOf(left.categoryId) - categoryIds.indexOf(right.categoryId)
        );
      })[0]?.categoryId;
    if (!categoryId) break;
    allocations.set(categoryId, (allocations.get(categoryId) ?? 0) + 1);
    allocated++;
  }

  const selected: T[] = [];
  for (const [categoryId, count] of allocations) {
    selected.push(...(sortedByCategory.get(categoryId) ?? []).slice(0, count));
  }
  return selected.sort(byOrder);
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
