import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { resolvePlaceImage } from '../../lib/region-images';
import { usePlaceImage } from '../../hooks/use-place-image';
import { RegionThumb } from '../ui/region-thumb';
import { usePlaceCategoryLabels } from '../../hooks/use-place-category-labels';
import type { PlaceCategory } from '../../types/place';

export function VenuePlaceCard({
  placeId,
  name,
  category,
  subtitle,
  imageUrl,
  cityName,
  to,
}: {
  placeId: number;
  name: string;
  category: PlaceCategory;
  subtitle?: string;
  imageUrl?: string | null;
  cityName?: string;
  to: string;
}): ReactElement {
  const categoryLabels = usePlaceCategoryLabels();
  const img = resolvePlaceImage(placeId, category, imageUrl, name);
  const displayImg = usePlaceImage(img, name, cityName);

  return (
    <Link to={to} className="tap-scale group block overflow-hidden rounded-2xl border border-stone-900/8 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="relative aspect-[16/10] overflow-hidden">
        <RegionThumb
          src={displayImg}
          alt={name}
          label={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {categoryLabels[category]}
        </span>
      </div>
      <div className="p-3">
        <p className="font-display text-base font-extrabold leading-snug text-theme">{name}</p>
        {subtitle ? <p className="mt-1 line-clamp-2 text-xs text-theme-muted">{subtitle}</p> : null}
      </div>
    </Link>
  );
}
