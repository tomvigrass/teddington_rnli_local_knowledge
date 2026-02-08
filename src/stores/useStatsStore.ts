import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../core/storage/zustandStorage';
import { UserStats } from '../models';

interface StatsState extends UserStats {
  recordTestResult: (correct: number, total: number) => void;
  recordAnswer: (correct: boolean) => void;
  reset: () => void;
}

const initialState: UserStats = {
  lastScore: undefined,
  totalQuestionsAttempted: 0,
  totalCorrect: 0,
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      ...initialState,

      recordTestResult: (correct: number, total: number) =>
        set((state) => ({
          lastScore: {
            correct,
            total,
            date: new Date().toISOString(),
          },
          totalQuestionsAttempted: state.totalQuestionsAttempted + total,
          totalCorrect: state.totalCorrect + correct,
        })),

      recordAnswer: (correct: boolean) =>
        set((state) => ({
          totalQuestionsAttempted: state.totalQuestionsAttempted + 1,
          totalCorrect: state.totalCorrect + (correct ? 1 : 0),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'stats-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
