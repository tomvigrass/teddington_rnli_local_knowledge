import { create } from 'zustand';
import { Question, TestMode, TestSession, TestResults } from '../models';

interface TestState {
  session: TestSession | null;
  questions: Question[];
  results: TestResults | null;

  startSession: (mode: TestMode, questions: Question[]) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeSession: () => void;
  clearSession: () => void;
  replaceQuestion: (index: number, newQuestion: Question) => void;
  removeQuestion: (index: number) => void;
}

export const useTestStore = create<TestState>()((set, get) => ({
  session: null,
  questions: [],
  results: null,

  startSession: (mode: TestMode, questions: Question[]) =>
    set({
      session: {
        id: Date.now().toString(),
        mode,
        questionIds: questions.map((q) => q.id),
        userAnswers: {},
        currentIndex: 0,
        completed: false,
        startedAt: new Date().toISOString(),
      },
      questions,
      results: null,
    }),

  answerQuestion: (questionId: string, answer: string) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [questionId]: answer,
          },
        },
      };
    }),

  goToQuestion: (index: number) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          currentIndex: Math.max(
            0,
            Math.min(index, state.session.questionIds.length - 1)
          ),
        },
      };
    }),

  nextQuestion: () =>
    set((state) => {
      if (!state.session) return state;
      const nextIndex = state.session.currentIndex + 1;
      if (nextIndex >= state.session.questionIds.length) return state;
      return {
        session: {
          ...state.session,
          currentIndex: nextIndex,
        },
      };
    }),

  previousQuestion: () =>
    set((state) => {
      if (!state.session) return state;
      const prevIndex = state.session.currentIndex - 1;
      if (prevIndex < 0) return state;
      return {
        session: {
          ...state.session,
          currentIndex: prevIndex,
        },
      };
    }),

  completeSession: () => {
    const { session, questions } = get();
    if (!session) return;

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let correctCount = 0;
    const incorrectQuestionIds: string[] = [];

    for (const questionId of session.questionIds) {
      const question = questionMap.get(questionId);
      if (!question) continue;
      const userAnswer = session.userAnswers[questionId];
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectQuestionIds.push(questionId);
      }
    }

    const totalQuestions = session.questionIds.length;
    const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    set({
      session: { ...session, completed: true },
      results: {
        totalQuestions,
        correctCount,
        score,
        passed: score >= 0.9,
        incorrectQuestionIds,
        userAnswers: { ...session.userAnswers },
      },
    });
  },

  clearSession: () =>
    set({
      session: null,
      questions: [],
      results: null,
    }),

  replaceQuestion: (index: number, newQuestion: Question) =>
    set((state) => {
      if (!state.session) return state;
      const oldId = state.session.questionIds[index];
      const newQuestionIds = [...state.session.questionIds];
      newQuestionIds[index] = newQuestion.id;
      const newQuestions = [...state.questions];
      newQuestions[index] = newQuestion;
      const { [oldId]: _removed, ...restAnswers } = state.session.userAnswers;
      return {
        session: {
          ...state.session,
          questionIds: newQuestionIds,
          userAnswers: restAnswers,
        },
        questions: newQuestions,
      };
    }),

  removeQuestion: (index: number) =>
    set((state) => {
      if (!state.session) return state;
      const oldId = state.session.questionIds[index];
      const newQuestionIds = state.session.questionIds.filter((_, i) => i !== index);
      const newQuestions = state.questions.filter((_, i) => i !== index);
      if (newQuestionIds.length === 0) return state;
      const { [oldId]: _removed, ...restAnswers } = state.session.userAnswers;
      const newIndex = Math.min(state.session.currentIndex, newQuestionIds.length - 1);
      return {
        session: {
          ...state.session,
          questionIds: newQuestionIds,
          userAnswers: restAnswers,
          currentIndex: newIndex,
        },
        questions: newQuestions,
      };
    }),
}));
