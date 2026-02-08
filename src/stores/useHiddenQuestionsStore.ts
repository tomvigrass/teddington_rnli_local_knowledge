import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../core/storage/zustandStorage';

interface HiddenQuestionsState {
  hiddenIds: string[];
  hideQuestion: (id: string) => void;
  unhideAll: () => void;
}

export const useHiddenQuestionsStore = create<HiddenQuestionsState>()(
  persist(
    (set) => ({
      hiddenIds: [],

      hideQuestion: (id: string) =>
        set((state) => {
          if (state.hiddenIds.includes(id)) return state;
          return { hiddenIds: [...state.hiddenIds, id] };
        }),

      unhideAll: () => set({ hiddenIds: [] }),
    }),
    {
      name: 'hidden-questions-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
