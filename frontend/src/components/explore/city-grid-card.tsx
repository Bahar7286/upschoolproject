import { MapPin } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { resolveCityImage } from '../../lib/region-images';
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
  const displayImg = useRegionImage(img, name);

  return (
    <Link
      to={to}
      className="tap-scale group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-lift"
    >
      <RegionThumb
        src={displayImg}
        alt={name}
        label={name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white backdrop-blur-sm">
        {plateCode}
      </span>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-display text-lg font-extrabold text-white drop-shadow-sm">{name}</p>
        {districtCount != null ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
            {districtCount} İlçe
          </p>
        ) : (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-white/80">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            Keşfet
          </p>
        )}
      </div>
    </Link>
  );
}
