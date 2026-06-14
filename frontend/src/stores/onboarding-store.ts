import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingState {
  preferredCity: string;
  interests: string[];
  durationMinutes: number;
  budget: number;
  preferredLanguage: 'tr' | 'en' | 'de';
  setPreferredCity: (city: string) => void;
  setInterests: (interests: string[]) => void;
  setDurationMinutes: (minutes: number) => void;
  setBudget: (budget: number) => void;
  setPreferredLanguage: (lang: 'tr' | 'en' | 'de') => void;
  hydrateFromUser: (data: {
    preferred_city?: string | null;
    interests?: string[];
    duration_minutes?: number;
    budget?: number;
    preferred_language?: string;
  }) => void;
  reset: () => void;
}

const defaults = {
  preferredCity: 'İstanbul',
  interests: [] as string[],
  durationMinutes: 120,
  budget: 1500,
  preferredLanguage: 'tr' as const,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...defaults,
      setPreferredCity: (preferredCity) => set({ preferredCity }),
      setInterests: (interests) => set({ interests }),
      setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
      setBudget: (budget) => set({ budget }),
      setPreferredLanguage: (preferredLanguage) => set({ preferredLanguage }),
      hydrateFromUser: (data) =>
        set({
          preferredCity: data.preferred_city?.trim() || defaults.preferredCity,
          interests: data.interests ?? defaults.interests,
          durationMinutes: data.duration_minutes ?? defaults.durationMinutes,
          budget: data.budget ?? defaults.budget,
          preferredLanguage:
            data.preferred_language === 'en' || data.preferred_language === 'de'
              ? data.preferred_language
              : 'tr',
        }),
      reset: () => set({ ...defaults }),
    }),
    { name: 'historial_go_onboarding' },
  ),
);
