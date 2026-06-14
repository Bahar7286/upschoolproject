import { useMemo } from 'react';

import { useI18n } from '../lib/i18n';
import type { PlaceCategory } from '../types/place';

/** Kategori etiketleri — locale ile uyumlu */
export function usePlaceCategoryLabels(): Record<PlaceCategory, string> {
  const { t } = useI18n();
  return useMemo(
    () => ({
      museum: t('placeCategory.museum', 'Müze'),
      palace: t('placeCategory.palace', 'Saray'),
      historical: t('placeCategory.historical', 'Tarihi'),
      mosque: t('placeCategory.mosque', 'Cami'),
      bazaar: t('placeCategory.bazaar', 'Çarşı'),
      street: t('placeCategory.street', 'Sokak'),
      restaurant: t('placeCategory.restaurant', 'Yemek'),
      accommodation: t('placeCategory.accommodation', 'Konaklama'),
    }),
    [t],
  );
}
