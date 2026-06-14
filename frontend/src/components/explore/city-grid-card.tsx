import { MapPin } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { resolveCityImage } from '../../lib/region-images';
import { isSvgPlaceholder } from '../../lib/wikipedia-thumb';
import { useRegionImage } from '../../hooks/use-region-image';
import { RegionThumb } from '../ui/region-thumb';

export function CityGridCard({
  cityId,
  name,
  slug,
  plateCode,
  districtCount,
  imageUrl,
  to,
}: {
  cityId: number;
  name: string;
  slug: string;
  plateCode: string;
  districtCount?: number;
  imageUrl?: string | null;
  to: string;
}): ReactElement {
  const img = resolveCityImage(slug, cityId, imageUrl);
  const displayImg = useRegionImage(img, name, isSvgPlaceholder(img), slug);
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <Link
      to={to}
      className="tap-scale group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-lift"
    >
      <RegionThumb
        src={displayImg}
        alt={displayName}
        label={displayName}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/10" />
      <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur-sm">
        {plateCode}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pb-3 pt-10">
        <p
          className="font-display text-lg font-extrabold leading-tight text-white"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
        >
          {displayName}
        </p>
        {districtCount != null ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
            {districtCount} İlçe
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-white/90">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            Keşfet
          </p>
        )}
      </div>
    </Link>
  );
}
