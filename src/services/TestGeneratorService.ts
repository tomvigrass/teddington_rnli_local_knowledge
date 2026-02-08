import { Question, QuestionCategory } from '../models';
import { getAllQuestions, getQuestionsByCategories } from './QuestionService';
import { shuffleArray } from '../core/utils/shuffleUtils';

export function generateQuickTest(hiddenIds?: string[]): Question[] {
  const all = getAllQuestions(hiddenIds);
  const shuffled = shuffleArray(all);
  return shuffled.slice(0, Math.min(20, shuffled.length));
}

export function generateCustomTest(
  categories: QuestionCategory[],
  count: number,
  hiddenIds?: string[]
): Question[] {
  const pool = getQuestionsByCategories(categories, hiddenIds);
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getNextEndlessQuestion(excludeIds: string[], hiddenIds?: string[]): Question | null {
  const all = getAllQuestions(hiddenIds);
  const available = all.filter((q) => !excludeIds.includes(q.id));

  if (available.length === 0) {
    // All questions seen, reset the pool
    const shuffled = shuffleArray(all);
    return shuffled[0] ?? null;
  }

  const shuffled = shuffleArray(available);
  return shuffled[0];
}

export function getNextEndlessQuestionFiltered(
  categories: QuestionCategory[],
  excludeIds: string[],
  hiddenIds?: string[]
): Question | null {
  const pool = getQuestionsByCategories(categories, hiddenIds);
  const available = pool.filter((q) => !excludeIds.includes(q.id));

  if (available.length === 0) {
    const shuffled = shuffleArray(pool);
    return shuffled[0] ?? null;
  }

  const shuffled = shuffleArray(available);
  return shuffled[0];
}

export function getReplacementQuestion(
  excludeIds: string[],
  hiddenIds?: string[],
  categories?: QuestionCategory[]
): Question | null {
  const pool = categories && categories.length > 0
    ? getQuestionsByCategories(categories, hiddenIds)
    : getAllQuestions(hiddenIds);
  const available = pool.filter((q) => !excludeIds.includes(q.id));
  if (available.length === 0) return null;
  const shuffled = shuffleArray(available);
  return shuffled[0];
}
