import { useMemo } from 'react';

import { useI18n } from '../lib/i18n';
import type { FontPreference, ThemePreference } from '../stores/theme-store';

export function useThemeLabels(): Record<ThemePreference, string> {
  const { t } = useI18n();
  return useMemo(
    () => ({
      system: t('profile.themes.system', 'Sistem'),
      light: t('profile.themes.light', 'Gündüz'),
      dark: t('profile.themes.dark', 'Gece'),
      heritage: t('profile.themes.heritage', 'Miras'),
      ocean: t('profile.themes.ocean', 'Okyanus'),
      sunset: t('profile.themes.sunset', 'Gün batımı'),
      forest: t('profile.themes.forest', 'Orman'),
      classic: t('profile.themes.classic', 'Klasik'),
    }),
    [t],
  );
}

export function useFontLabels(): Record<FontPreference, string> {
  const { t } = useI18n();
  return useMemo(
    () => ({
      sans: t('profile.fonts.sans', 'Modern'),
      serif: t('profile.fonts.serif', 'Klasik serif'),
      rounded: t('profile.fonts.rounded', 'Yuvarlak'),
    }),
    [t],
  );
}
