import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference =
  | 'light'
  | 'dark'
  | 'system'
  | 'heritage'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'classic';

export type FontPreference = 'sans' | 'serif' | 'rounded';

type ThemeState = {
  preference: ThemePreference;
  font: FontPreference;
  setPreference: (preference: ThemePreference) => void;
  setFont: (font: FontPreference) => void;
};

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Sistem',
  light: 'Gündüz',
  dark: 'Gece',
  heritage: 'Miras',
  ocean: 'Okyanus',
  sunset: 'Gün batımı',
  forest: 'Orman',
  classic: 'Klasik',
};

export const FONT_LABELS: Record<FontPreference, string> = {
  sans: 'Modern',
  serif: 'Klasik serif',
  rounded: 'Yuvarlak',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      font: 'sans',
      setPreference: (preference) => set({ preference }),
      setFont: (font) => set({ font }),
    }),
    { name: 'historial_go_theme' },
  ),
);

export function getResolvedTheme(preference: ThemePreference): ThemePreference | 'light' | 'dark' {
  if (preference === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}
