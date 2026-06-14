import { useMemo } from 'react';

import { useI18n } from '../lib/i18n';

export function useBadgeLabels(): Record<string, string> {
  const { t } = useI18n();
  return useMemo(
    () => ({
      welcome: t('profile.badges.welcome', 'Hoş geldin'),
      first_step: t('profile.badges.firstStep', 'İlk adım'),
      route_explorer: t('profile.badges.routeExplorer', 'Rota kaşifi'),
      streak_3: t('profile.badges.streak3', '3 gün seri'),
      streak_7: t('profile.badges.streak7', '7 gün seri'),
    }),
    [t],
  );
}
