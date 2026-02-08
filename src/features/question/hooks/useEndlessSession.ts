import { useState, useCallback } from 'react';
import { Question, QuestionCategory } from '../../../models';
import {
  getNextEndlessQuestion,
  getNextEndlessQuestionFiltered,
} from '../../../services/TestGeneratorService';
import { useStatsStore } from '../../../stores/useStatsStore';
import { useHiddenQuestionsStore } from '../../../stores/useHiddenQuestionsStore';

export function useEndlessSession(categories?: QuestionCategory[]) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(() => {
    const hiddenIds = useHiddenQuestionsStore.getState().hiddenIds;
    return categories && categories.length > 0
      ? getNextEndlessQuestionFiltered(categories, [], hiddenIds)
      : getNextEndlessQuestion([], hiddenIds);
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>();
  const [showFeedback, setShowFeedback] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const recordAnswer = useStatsStore((s) => s.recordAnswer);
  const recordTestResult = useStatsStore((s) => s.recordTestResult);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion || showFeedback) return;
      setSelectedAnswer(answer);
      setShowFeedback(true);
      setQuestionsAnswered((prev) => prev + 1);

      const isCorrect = answer === currentQuestion.correctAnswer;
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }

      // Record answer in running totals only (lastScore updated on exit)
      recordAnswer(isCorrect);
    },
    [currentQuestion, showFeedback, recordAnswer]
  );

  const handleNext = useCallback(() => {
    if (!currentQuestion) return;

    const hiddenIds = useHiddenQuestionsStore.getState().hiddenIds;
    const newSeenIds = [...seenIds, currentQuestion.id];
    setSeenIds(newSeenIds);
    setSelectedAnswer(undefined);
    setShowFeedback(false);

    const next =
      categories && categories.length > 0
        ? getNextEndlessQuestionFiltered(categories, newSeenIds, hiddenIds)
        : getNextEndlessQuestion(newSeenIds, hiddenIds);

    setCurrentQuestion(next);
  }, [currentQuestion, seenIds, categories]);

  const endSession = useCallback(() => {
    if (questionsAnswered > 0) {
      recordTestResult(correctCount, questionsAnswered);
    }
  }, [questionsAnswered, correctCount, recordTestResult]);

  return {
    currentQuestion,
    selectedAnswer,
    showFeedback,
    questionsAnswered,
    correctCount,
    handleAnswer,
    handleNext,
    endSession,
  };
}
