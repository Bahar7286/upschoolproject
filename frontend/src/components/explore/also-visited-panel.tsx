import { useQuery } from '@tanstack/react-query';
import { MapPin, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { APP_ROUTES } from '../../lib/routes';
import { resolvePlaceImage, resolveGooglePlaceImage } from '../../lib/region-images';
import {
  fetchGooglePlaceAlsoVisited,
  fetchPlaceAlsoVisited,
} from '../../services/place-visit-service';
import type { AlsoVisitedItem } from '../../types/place-visit';
import { RegionThumb } from '../ui/region-thumb';

function itemHref(item: AlsoVisitedItem): string {
  if (item.entity_type === 'place' && item.place_id) {
    return APP_ROUTES.dbPlace(item.place_id);
  }
  if (item.google_place_id) {
    return APP_ROUTES.googlePlace(item.google_place_id);
  }
  return APP_ROUTES.discover;
}

function itemImage(item: AlsoVisitedItem): string {
  if (item.entity_type === 'place' && item.place_id) {
    return resolvePlaceImage(item.place_id, item.category ?? 'historical', item.image_url, item.name);
  }
  return resolveGooglePlaceImage(item.image_url, item.name);
}

function AlsoVisitedCard({ item }: { item: AlsoVisitedItem }): ReactElement {
  const src = itemImage(item);
  const cityName = item.city ?? undefined;

  return (
    <Link
      to={itemHref(item)}
      className="tap-scale group flex min-w-[168px] max-w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RegionThumb
          src={src}
          alt={item.name}
          label={item.name}
          placeName={item.name}
          cityName={cityName}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          %{Math.round(item.co_visit_percent)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 font-display text-sm font-bold leading-snug text-stone-900 dark:text-stone-100">
          {item.name}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
          <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
          {item.co_visit_count} gezgin
        </p>
      </div>
    </Link>
  );
}

export function AlsoVisitedPanel({
  entityType,
  entityKey,
  placeId,
  googlePlaceId,
  placeName,
  city,
}: {
  entityType: 'place' | 'google_place';
  entityKey?: string;
  placeId?: number;
  googlePlaceId?: string;
  placeName?: string;
  city?: string;
}): ReactElement | null {
  const key =
    entityType === 'place'
      ? String(placeId ?? entityKey ?? '')
      : String(googlePlaceId ?? entityKey ?? '');

  const { data, isPending } = useQuery({
    queryKey: ['also-visited', entityType, key, city ?? ''],
    queryFn: () =>
      entityType === 'place' && placeId
        ? fetchPlaceAlsoVisited(placeId, { city, limit: 6 })
        : fetchGooglePlaceAlsoVisited(googlePlaceId ?? key, {
            city,
            place_name: placeName,
            limit: 6,
          }),
    enabled: Boolean(key),
    staleTime: 5 * 60 * 1000,
  });

  if (isPending) {
    return (
      <section className="rounded-2xl border border-stone-900/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <div className="h-5 w-48 animate-pulse rounded bg-stone-200 dark:bg-zinc-700" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 w-[168px] shrink-0 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" />
          ))}
        </div>
      </section>
    );
  }

  if (!data?.items.length) return null;

  const headline =
    data.source_place_name || placeName
      ? `${data.source_place_name || placeName}’ı gezenler bunları da ziyaret etti`
      : 'Gezginlerin birlikte tercih ettiği mekanlar';

  return (
    <section
      className="rounded-2xl border border-stone-900/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      aria-labelledby="also-visited-heading"
    >
      <h2
        id="also-visited-heading"
        className="flex items-start gap-2 font-display text-lg font-bold text-stone-900 dark:text-stone-100"
      >
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <span>{headline}</span>
      </h2>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {data.total_visitors} gezginin tercihlerine göre · anonim istatistik
      </p>
      <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1">
        {data.items.map((item) => (
          <AlsoVisitedCard key={`${item.entity_type}-${item.entity_key}`} item={item} />
        ))}
      </div>
    </section>
  );
}
