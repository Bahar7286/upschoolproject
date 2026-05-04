import { create } from 'zustand';

export interface OnboardingState {
  interests: string[];
  durationMinutes: number;
  budget: number;
  setInterests: (interests: string[]) => void;
  setDurationMinutes: (minutes: number) => void;
  setBudget: (budget: number) => void;
  reset: () => void;
}

const defaults = {
  interests: [] as string[],
  durationMinutes: 120,
  budget: 150,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...defaults,
  setInterests: (interests) => set({ interests }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
  setBudget: (budget) => set({ budget }),
  reset: () => set({ ...defaults }),
}));
