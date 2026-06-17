import type { IcebreakerCategory, IcebreakerQuestion } from "@/lib/types";
import { ICEBREAKER_QUESTIONS } from "./questions";

export function pickIcebreaker(
  alreadySeenIds: ReadonlySet<string>,
  categories: IcebreakerCategory[],
  extraQuestions: IcebreakerQuestion[] = [],
): { question: IcebreakerQuestion; resetTriggered: boolean } {
  const allQuestions = [...ICEBREAKER_QUESTIONS, ...extraQuestions];

  const pool = categories.length > 0
    ? allQuestions.filter((q) => categories.includes(q.category))
    : allQuestions;

  let candidates = pool.filter((q) => !alreadySeenIds.has(q.id));
  let resetTriggered = false;

  if (candidates.length === 0) {
    candidates = pool;
    resetTriggered = true;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return { question: picked, resetTriggered };
}
