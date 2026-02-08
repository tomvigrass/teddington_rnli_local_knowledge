export type TestMode = 'quickTest' | 'customTest' | 'endless';

export interface TestSession {
  id: string;
  mode: TestMode;
  questionIds: string[];
  userAnswers: Record<string, string>;
  currentIndex: number;
  completed: boolean;
  startedAt: string;
}

export interface TestResults {
  totalQuestions: number;
  correctCount: number;
  score: number;
  passed: boolean;
  incorrectQuestionIds: string[];
  userAnswers: Record<string, string>;
}

export interface UserStats {
  lastScore?: { correct: number; total: number; date: string };
  totalQuestionsAttempted: number;
  totalCorrect: number;
}
