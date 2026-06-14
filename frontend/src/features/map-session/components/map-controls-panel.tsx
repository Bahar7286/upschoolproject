import type { ReactElement } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';

import { useI18n } from '../../../lib/i18n';
import { PLACE_CATEGORY_COLORS, type PlaceCategory } from '../../../types/place';

type Props = {
  allCategories: PlaceCategory[];
  categoryFilter: PlaceCategory | null;
  categoryLabels: Record<PlaceCategory, string>;
  showPlaces: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  onCategoryChange: (cat: PlaceCategory | null) => void;
  onShowPlacesChange: (show: boolean) => void;
};

export function MapControlsPanel({
  allCategories,
  categoryFilter,
  categoryLabels,
  showPlaces,
  searchParams,
  setSearchParams,
  onCategoryChange,
  onShowPlacesChange,
}: Props): ReactElement {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2">
      <button
        className={`tap-scale touch-chip text-xs ${categoryFilter === null ? 'bg-primary text-white' : 'border border-stone-900/15 dark:border-white/15'}`}
        type="button"
        onClick={() => onCategoryChange(null)}
      >
        {t('map.allCategories', 'Tümü')}
      </button>
      {allCategories.map((cat) => (
        <button
          className={`tap-scale touch-chip gap-1.5 text-xs ${categoryFilter === cat ? 'bg-primary text-white' : 'border border-stone-900/15 dark:border-white/15'}`}
          key={cat}
          type="button"
          onClick={() => {
            const next = categoryFilter === cat ? null : cat;
            onCategoryChange(next);
            const params = new URLSearchParams(searchParams);
            if (next) params.set('category', next);
            else params.delete('category');
            setSearchParams(params, { replace: true });
          }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: PLACE_CATEGORY_COLORS[cat] }}
            aria-hidden="true"
          />
          {categoryLabels[cat]}
        </button>
      ))}
      <label className="inline-flex min-h-[44px] w-full items-center gap-2 text-sm font-semibold sm:ml-auto sm:w-auto">
        <input checked={showPlaces} type="checkbox" onChange={(e) => onShowPlacesChange(e.target.checked)} />
        {t('map.poiPins', 'POI pinleri')}
      </label>
    </div>
  );
}
