import {
  getAllQuestions,
  getQuestionById,
  getQuestionsByCategory,
  getQuestionsByCategories,
  getCategories,
  getQuestionCount,
} from '../src/services/QuestionService';
import { QuestionCategory } from '../src/models';

describe('QuestionService', () => {
  describe('getAllQuestions', () => {
    it('returns all questions', () => {
      const questions = getAllQuestions();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('each question has required fields', () => {
      const questions = getAllQuestions();
      for (const q of questions) {
        expect(q.id).toBeDefined();
        expect(q.type).toBeDefined();
        expect(q.category).toBeDefined();
        expect(q.difficulty).toBeDefined();
        expect(q.questionText).toBeDefined();
        expect(q.correctAnswer).toBeDefined();
        expect(q.options).toHaveLength(4);
        expect(q.explanation).toBeDefined();
        expect(q.referenceSection).toBeDefined();
      }
    });

    it('each question has its correct answer in its options', () => {
      const questions = getAllQuestions();
      for (const q of questions) {
        expect(q.options).toContain(q.correctAnswer);
      }
    });

    it('each question has a unique id', () => {
      const questions = getAllQuestions();
      const ids = questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getQuestionById', () => {
    it('returns the correct question', () => {
      const q = getQuestionById('q_001');
      expect(q).toBeDefined();
      expect(q!.id).toBe('q_001');
    });

    it('returns undefined for non-existent id', () => {
      expect(getQuestionById('nonexistent')).toBeUndefined();
    });
  });

  describe('getQuestionsByCategory', () => {
    it('filters by category correctly', () => {
      const questions = getQuestionsByCategory(QuestionCategory.PLAWarnings);
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q.category).toBe(QuestionCategory.PLAWarnings);
      }
    });
  });

  describe('getQuestionsByCategories', () => {
    it('filters by multiple categories', () => {
      const categories = [QuestionCategory.Islands, QuestionCategory.Bridges];
      const questions = getQuestionsByCategories(categories);
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(categories).toContain(q.category);
      }
    });
  });

  describe('getCategories', () => {
    it('returns all 10 categories', () => {
      const cats = getCategories();
      expect(cats).toHaveLength(10);
    });

    it('each category has a questionCount', () => {
      const cats = getCategories();
      for (const c of cats) {
        expect(typeof c.questionCount).toBe('number');
      }
    });
  });

  describe('getQuestionCount', () => {
    it('returns the total number of questions', () => {
      const count = getQuestionCount();
      expect(count).toBeGreaterThan(0);
      expect(count).toBe(getAllQuestions().length);
    });
  });
});
