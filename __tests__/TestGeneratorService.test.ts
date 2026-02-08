import {
  generateQuickTest,
  generateCustomTest,
  getNextEndlessQuestion,
  getNextEndlessQuestionFiltered,
} from '../src/services/TestGeneratorService';
import { QuestionCategory } from '../src/models';
import { getAllQuestions } from '../src/services/QuestionService';

describe('TestGeneratorService', () => {
  describe('generateQuickTest', () => {
    it('returns up to 20 questions', () => {
      const questions = generateQuickTest();
      expect(questions.length).toBeLessThanOrEqual(20);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('returns shuffled questions (not always the same order)', () => {
      const results = new Set<string>();
      for (let i = 0; i < 5; i++) {
        const questions = generateQuickTest();
        results.add(questions.map((q) => q.id).join(','));
      }
      // With 20+ questions, extremely unlikely all 5 orders are the same
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('generateCustomTest', () => {
    it('returns questions only from selected categories', () => {
      const categories = [QuestionCategory.Islands];
      const questions = generateCustomTest(categories, 10);
      for (const q of questions) {
        expect(q.category).toBe(QuestionCategory.Islands);
      }
    });

    it('respects the count limit', () => {
      const questions = generateCustomTest(
        [QuestionCategory.Islands, QuestionCategory.Bridges],
        3
      );
      expect(questions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getNextEndlessQuestion', () => {
    it('returns a question not in the exclude list', () => {
      const question = getNextEndlessQuestion(['q_001', 'q_002']);
      expect(question).not.toBeNull();
      expect(question!.id).not.toBe('q_001');
      expect(question!.id).not.toBe('q_002');
    });

    it('resets when all questions have been seen', () => {
      const allIds = getAllQuestions().map((q) => q.id);
      const question = getNextEndlessQuestion(allIds);
      // Should still return a question (pool resets)
      expect(question).not.toBeNull();
    });
  });

  describe('getNextEndlessQuestionFiltered', () => {
    it('returns a question from specified categories', () => {
      const question = getNextEndlessQuestionFiltered(
        [QuestionCategory.PLAWarnings],
        []
      );
      expect(question).not.toBeNull();
      expect(question!.category).toBe(QuestionCategory.PLAWarnings);
    });
  });
});
