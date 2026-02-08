import { Question, QuestionCategory } from '../models';
import questionsData from '../data/questions.json';
import categoriesData from '../data/categories.json';

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  questionCategory: QuestionCategory;
  questionCount: number;
}

const questions: Question[] = questionsData.questions as Question[];

function filterHidden(qs: Question[], hiddenIds?: string[]): Question[] {
  if (!hiddenIds || hiddenIds.length === 0) return qs;
  return qs.filter((q) => !hiddenIds.includes(q.id));
}

export function getAllQuestions(hiddenIds?: string[]): Question[] {
  return filterHidden(questions, hiddenIds);
}

export function getQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function getQuestionsByCategory(category: QuestionCategory, hiddenIds?: string[]): Question[] {
  return filterHidden(
    questions.filter((q) => q.category === category),
    hiddenIds
  );
}

export function getQuestionsByCategories(categories: QuestionCategory[], hiddenIds?: string[]): Question[] {
  return filterHidden(
    questions.filter((q) => categories.includes(q.category)),
    hiddenIds
  );
}

export function getCategories(hiddenIds?: string[]): CategoryInfo[] {
  return categoriesData.categories.map((cat) => ({
    ...cat,
    questionCategory: cat.questionCategory as QuestionCategory,
    questionCount: filterHidden(
      questions.filter((q) => q.category === cat.questionCategory),
      hiddenIds
    ).length,
  }));
}

export function getQuestionCount(hiddenIds?: string[]): number {
  return filterHidden(questions, hiddenIds).length;
}
