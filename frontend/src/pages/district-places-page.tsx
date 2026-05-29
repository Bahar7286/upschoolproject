import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Utensils, BedDouble, Landmark } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { CategoryIconCard } from '../components/explore/category-icon-card';
import { BackButton } from '../components/ui/back-button';
import { ExploreHero } from '../components/explore/explore-hero';
import { useI18n } from '../lib/i18n';
import { GoogleVenuePlaceCard } from '../components/explore/google-venue-place-card';
import { VenuePlaceCard } from '../components/explore/venue-place-card';
import { RegionInlineMap } from '../features/map/region-inline-map';
import { formatApiError } from '../lib/api';
import { googlePlaceDetailPath } from '../lib/routes';
import { listCities, listDistrictsByCity } from '../services/city-service';
import { fetchGeoCenter, fetchGooglePlacesNearby } from '../services/google-service';
import { listPlaces } from '../services/place-service';
import type { GooglePlaceSummary } from '../types/google';
import type { PlaceCategory, PlaceResponse } from '../types/place';
import { PLACE_CATEGORY_LABELS } from '../types/place';

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

function mergeVenues(
  db: PlaceResponse[],
  google: GooglePlaceSummary[],
  q: string,
): { db: PlaceResponse[]; google: GooglePlaceSummary[] } {
  const needle = normName(q);
  const dbNames = new Set(db.map((p) => normName(p.name)));
  const filteredDb = needle
    ? db.filter((p) => normName(p.name).includes(needle) || normName(p.description).includes(needle))
    : db;
  const filteredGoogle = (needle
    ? google.filter(
        (p) => normName(p.name).includes(needle) || normName(p.address).includes(needle),
      )
    : google
  ).filter((p) => !dbNames.has(normName(p.name)));
  return { db: filteredDb, google: filteredGoogle };
}

export default function DistrictPlacesPage(): ReactElement {
  const { t } = useI18n();
  const { cityId, districtId } = useParams();
  const city_id = Number(cityId);
  const district_id = Number(districtId);
  const [searchParams] = useSearchParams();
  const category = (searchParams.get('category') as PlaceCategory | null) ?? null;
  const [q, setQ] = useState('');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });
  const city = useMemo(() => cities.find((c) => c.city_id === city_id) ?? null, [cities, city_id]);

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', city_id],
    queryFn: () => listDistrictsByCity(city_id),
    enabled: Number.isFinite(city_id) && city_id > 0,
    staleTime: 60 * 60 * 1000,
  });
  const district = useMemo(
    () => districts.find((d) => d.district_id === district_id) ?? null,
    [districts, district_id],
  );

  const base = `/cities/${city_id}/districts/${district_id}`;
  const cityBack = city ? `/cities/${city.city_id}` : '/cities';

  const districtCategories = useMemo(
    () =>
      [
        {
          id: 'museum' as const,
          label: t('district.museum', 'Gezilecek'),
          description: t('district.museumDesc', 'Müze, tarih ve turistik noktalar'),
          icon: Landmark,
        },
        {
          id: 'restaurant' as const,
          label: t('district.restaurant', 'Yeme-İçme'),
          description: t('district.restaurantDesc', 'Restoran, kafe ve lezzet durakları'),
          icon: Utensils,
        },
        {
          id: 'accommodation' as const,
          label: t('district.accommodation', 'Konaklama'),
          description: t('district.accommodationDesc', 'Otel ve konaklama seçenekleri'),
          icon: BedDouble,
        },
      ] as const,
    [t],
  );

  const { data: center } = useQuery({
    queryKey: ['geo-center', district_id],
    queryFn: () => fetchGeoCenter({ districtId: district_id }),
    enabled: district_id > 0,
    staleTime: 60 * 60 * 1000,
  });

  const { data: dbPlaces = [], isPending: dbPending, isError: dbError } = useQuery({
    queryKey: ['district-places', city?.name_tr ?? '', district?.name_tr ?? '', category ?? 'all'],
    queryFn: () =>
      listPlaces({
        city: city?.name_tr ?? undefined,
        district: district?.name_tr ?? undefined,
        category: category ?? undefined,
        limit: 200,
      }),
    enabled: Boolean(city && district && category),
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: googlePlaces = [],
    isPending: googlePending,
    isError: googleError,
    error: googleErr,
  } = useQuery({
    queryKey: ['district-google', center?.lat, center?.lng, category],
    queryFn: () =>
      fetchGooglePlacesNearby({
        lat: center!.lat,
        lng: center!.lng,
        radius_m: 8000,
        category,
      }).then((r) => r.places),
    enabled: Boolean(center && category),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const merged = useMemo(
    () => mergeVenues(dbPlaces, googlePlaces, q.trim()),
    [dbPlaces, googlePlaces, q],
  );

  const totalCount = merged.db.length + merged.google.length;
  const isPending = Boolean(category) && (dbPending || googlePending);
  const googleUnavailable =
    googleError && formatApiError(googleErr).toLowerCase().includes('google');

  if (!category) {
    return (
      <section className="mx-auto max-w-3xl space-y-4" aria-labelledby="district-hub-title">
        <BackButton to={cityBack} />
        <ExploreHero
          title={district?.name_tr ?? 'İlçe'}
          subtitle={city?.name_tr ?? ''}
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {t('district.pickCategory', 'Kategori seçin')}
            </span>
          }
        />
        <h1 className="sr-only" id="district-hub-title">
          {district?.name_tr}
        </h1>
        <p className="px-1 text-sm text-theme-muted">
          {t('district.pickCategoryHint', 'Gezilecek yerler, yeme-içme ve konaklama mekanlarını görmek için bir kategori seçin.')}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {districtCategories.map(({ id, label, description, icon: Icon }) => (
            <CategoryIconCard
              key={id}
              to={`${base}?category=${id}`}
              label={label}
              description={description}
              icon={Icon}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4" aria-labelledby="district-title">
      <BackButton to={base} />
      <ExploreHero
        title={district?.name_tr ?? 'İlçe'}
        subtitle={`${city?.name_tr ?? ''} · ${PLACE_CATEGORY_LABELS[category]}`}
        badge={
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {t('district.venueCount', '{count} mekan').replace('{count}', String(totalCount))}
          </span>
        }
      >
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-md">
          <Search className="h-5 w-5 text-stone-400" aria-hidden="true" />
          <input
            className="w-full bg-transparent text-sm text-stone-800 outline-none"
            placeholder={t('district.searchPlaceholder', 'Mekan ara')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t('district.searchPlaceholder', 'Mekan ara')}
          />
        </div>
      </ExploreHero>

      <h1 className="sr-only" id="district-title">
        {district?.name_tr}
      </h1>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          to={base}
          className="tap-scale shrink-0 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm font-semibold dark:border-white/10 dark:bg-zinc-900"
        >
          {t('district.backCategories', '← Kategoriler')}
        </Link>
        {districtCategories.map(({ id, label }) => {
          const active = category === id;
          return (
            <Link
              key={id}
              to={`${base}?category=${id}`}
              className={`tap-scale shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                active ? 'bg-primary text-white' : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {city && district && center ? (
        <RegionInlineMap
          cityId={city.city_id}
          districtId={district.district_id}
          cityName={city.name_tr}
          districtName={district.name_tr}
          category={category}
          fallbackCenter={{ lat: center.lat, lng: center.lng }}
          showDbCount
        />
      ) : null}

      {isPending ? <div className="mt-4 h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {dbError ? (
        <p className="alert-error mt-4 rounded-xl px-3 py-2 text-sm" role="alert">
          Yerel mekan listesi yüklenemedi.
        </p>
      ) : null}
      {googleUnavailable && totalCount === 0 ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
          Bu ilçe için henüz kayıtlı mekan yok. Canlı mekan araması için sunucuda{' '}
          <strong>GOOGLE_PLACES_API_KEY</strong> tanımlanmalıdır.
        </p>
      ) : null}
      {!isPending && totalCount === 0 && !googleUnavailable ? (
        <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900">
          Bu kategoride mekan bulunamadı. Başka bir kategori deneyin.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {merged.db.map((p) => (
          <VenuePlaceCard
            key={`db-${p.place_id}`}
            placeId={p.place_id}
            name={p.name}
            category={p.category}
            subtitle={p.description || `${p.district}, ${p.city}`}
            imageUrl={p.image_url}
            to={`/places/${p.place_id}`}
          />
        ))}
        {merged.google.map((p) => {
          const cat = (p.category as PlaceCategory) || category;
          return (
            <GoogleVenuePlaceCard
              key={`g-${p.place_id}`}
              placeId={p.place_id}
              name={p.name}
              category={cat}
              subtitle={
                p.rating != null
                  ? `★ ${p.rating}${p.user_rating_count ? ` · ${p.user_rating_count} yorum` : ''}${p.address ? ` · ${p.address}` : ''}`
                  : p.address
              }
              photoUrl={p.photo_url}
              to={googlePlaceDetailPath(p.place_id, { back: `${base}?category=${category}`, cityId: city_id })}
            />
          );
        })}
      </div>
    </section>
  );
}
