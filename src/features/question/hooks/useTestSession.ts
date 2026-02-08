import { useCallback } from 'react';
import { useTestStore } from '../../../stores/useTestStore';
import { useStatsStore } from '../../../stores/useStatsStore';
import { Question } from '../../../models';

export function useTestSession() {
  const session = useTestStore((s) => s.session);
  const questions = useTestStore((s) => s.questions);
  const results = useTestStore((s) => s.results);
  const answerQuestion = useTestStore((s) => s.answerQuestion);
  const nextQuestion = useTestStore((s) => s.nextQuestion);
  const previousQuestion = useTestStore((s) => s.previousQuestion);
  const completeSession = useTestStore((s) => s.completeSession);
  const recordTestResult = useStatsStore((s) => s.recordTestResult);

  const currentQuestion: Question | null =
    session && questions[session.currentIndex]
      ? questions[session.currentIndex]
      : null;

  const currentAnswer: string | undefined =
    currentQuestion && session
      ? session.userAnswers[currentQuestion.id]
      : undefined;

  const isLastQuestion =
    session !== null &&
    session.currentIndex === session.questionIds.length - 1;

  const allAnswered =
    session !== null &&
    session.questionIds.every((id) => id in session.userAnswers);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion || !session) return;
      answerQuestion(currentQuestion.id, answer);
    },
    [currentQuestion, session, answerQuestion]
  );

  const handleNext = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handlePrevious = useCallback(() => {
    previousQuestion();
  }, [previousQuestion]);

  const handleComplete = useCallback(() => {
    completeSession();
    const state = useTestStore.getState();
    if (state.results) {
      recordTestResult(state.results.correctCount, state.results.totalQuestions);
    }
  }, [completeSession, recordTestResult]);

  return {
    session,
    currentQuestion,
    currentAnswer,
    isLastQuestion,
    allAnswered,
    results,
    totalQuestions: session?.questionIds.length ?? 0,
    currentIndex: session?.currentIndex ?? 0,
    handleAnswer,
    handleNext,
    handlePrevious,
    handleComplete,
  };
}
