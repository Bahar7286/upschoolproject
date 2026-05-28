import { ChevronRight } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../lib/i18n';
import { resolveDistrictImage } from '../../lib/region-images';
import { RegionThumb } from '../ui/region-thumb';

export function DistrictRowCard({
  citySlug,
  districtId,
  districtSlug,
  name,
  placeCount,
  imageUrl,
  to,
}: {
  citySlug: string;
  districtId: number;
  districtSlug: string;
  name: string;
  placeCount: number;
  imageUrl?: string | null;
  to: string;
}): ReactElement {
  const { t } = useI18n();
  const thumb = resolveDistrictImage(citySlug, districtId, districtSlug, imageUrl, name);

  return (
    <Link
      to={to}
      className="tap-scale flex items-center gap-3 rounded-2xl border border-stone-900/8 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900"
    >
      <RegionThumb src={thumb} alt={name} label={name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-extrabold text-theme">{name}</p>
        <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {placeCount > 0
            ? t('city.placesCount', '{count} Yer').replace('{count}', String(placeCount))
            : t('city.explore', 'Keşfet')}
        </span>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-white shadow-md">
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </span>
    </Link>
  );
}
