import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { resolvePlaceImage } from '../../lib/region-images';
import { RegionThumb } from '../ui/region-thumb';
import type { PlaceCategory } from '../../types/place';
import { PLACE_CATEGORY_LABELS } from '../../types/place';

export function VenuePlaceCard({
  placeId,
  name,
  category,
  subtitle,
  imageUrl,
  to,
}: {
  placeId: number;
  name: string;
  category: PlaceCategory;
  subtitle?: string;
  imageUrl?: string | null;
  to: string;
}): ReactElement {
  const img = resolvePlaceImage(placeId, category, imageUrl, name);

  return (
    <Link to={to} className="tap-scale group block overflow-hidden rounded-2xl border border-stone-900/8 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="relative aspect-[16/10] overflow-hidden">
        <RegionThumb
          src={img}
          alt={name}
          label={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {PLACE_CATEGORY_LABELS[category]}
        </span>
      </div>
      <div className="p-3">
        <p className="font-display text-base font-extrabold leading-snug text-theme">{name}</p>
        {subtitle ? <p className="mt-1 line-clamp-2 text-xs text-theme-muted">{subtitle}</p> : null}
      </div>
    </Link>
  );
}
