import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { GoogleVenuePlaceCard } from '../components/explore/google-venue-place-card';
import { VenuePlaceCard } from '../components/explore/venue-place-card';
import { ResetActiveRouteButton } from '../components/trip/reset-active-route-button';
import { RegionInlineMap } from '../features/map/region-inline-map';
import { usePlaceCategoryLabels } from '../hooks/use-place-category-labels';
import { formatGooglePlaceSubtitle, formatPlaceSubtitle } from '../lib/format-place-subtitle';
import { googlePlaceDetailPath } from '../lib/routes';
import { useI18n } from '../lib/i18n';
import { listCities } from '../services/city-service';
import { fetchGeoCenter } from '../services/google-service';
import { fetchRegionGooglePlaces } from '../services/region-venues-service';
import { listPlaces } from '../services/place-service';
import type { PlaceCategory } from '../types/place';

export default function CityPlacesPage(): ReactElement {
  const { t } = useI18n();
  const categoryLabels = usePlaceCategoryLabels();
  const { cityId } = useParams();
  const city_id = Number(cityId);
  const [searchParams] = useSearchParams();
  const category = (searchParams.get('category') as PlaceCategory | null) ?? null;
  const [q, setQ] = useState(() => searchParams.get('q') ?? '');

  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });
  const city = useMemo(() => cities.find((c) => c.city_id === city_id) ?? null, [cities, city_id]);

  const { data: center } = useQuery({
    queryKey: ['geo-center-city', city_id],
    queryFn: () => fetchGeoCenter({ cityId: city_id }),
    enabled: city_id > 0,
    staleTime: 60 * 60 * 1000,
  });

  const { data: places = [], isPending, isError } = useQuery({
    queryKey: ['city-places', city?.name_tr ?? '', category ?? 'all', q],
    queryFn: () =>
      listPlaces({
        city: city?.name_tr ?? undefined,
        category: category ?? undefined,
        q: q.trim() ? q.trim() : undefined,
        limit: 200,
      }),
    enabled: Boolean(city),
    staleTime: 2 * 60 * 1000,
  });

  const { data: googlePlaces = [], isPending: googlePending } = useQuery({
    queryKey: ['city-google', center?.lat, center?.lng, category, city?.name_tr],
    queryFn: () =>
      fetchRegionGooglePlaces({
        lat: center!.lat,
        lng: center!.lng,
        cityName: city!.name_tr,
        category: category!,
      }),
    enabled: Boolean(center && category && city),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const dbNames = new Set(places.map((p) => p.name.toLowerCase()));
  const extraGoogle = googlePlaces.filter((p) => !dbNames.has(p.name.toLowerCase()));

  return (
    <section className="page-container pb-8" aria-labelledby="cityp-title">
      <BackButton to={city ? `/cities/${city.city_id}` : '/cities'} />
      <ResetActiveRouteButton variant="bar" className="mt-2" />

      <header className="space-y-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-theme sm:text-3xl" id="cityp-title">
          {city?.name_tr ?? t('cityPlaces.cityFallback', 'Şehir')}{' '}
          {category ? `· ${categoryLabels[category]}` : ''}
        </h1>
        <p className="text-sm text-theme-muted">{t('cityPlaces.subtitle', 'Şehir genelinde mekanlar')}</p>
      </header>

      {city ? (
        <RegionInlineMap
          cityId={city.city_id}
          cityName={city.name_tr}
          category={category}
          fallbackCenter={{ lat: city.center_lat, lng: city.center_lng }}
        />
      ) : null}

      <div className="theme-card flex items-center gap-2 rounded-2xl p-3">
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder={t('cityPlaces.searchPlaceholder', 'Mekan ara')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isPending || googlePending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {isError ? (
        <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
          {t('cityPlaces.loadError', 'Mekanlar yüklenemedi.')}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((p) => (
          <VenuePlaceCard
            key={p.place_id}
            placeId={p.place_id}
            name={p.name}
            category={p.category}
            subtitle={formatPlaceSubtitle(p)}
            imageUrl={p.image_url}
            cityName={city?.name_tr}
            to={`/places/${p.place_id}`}
          />
        ))}
        {category
          ? extraGoogle.map((p) => (
              <GoogleVenuePlaceCard
                key={p.place_id}
                placeId={p.place_id}
                name={p.name}
                category={(p.category as PlaceCategory) || category}
                subtitle={formatGooglePlaceSubtitle(p.address, p.rating, p.user_rating_count)}
                photoUrl={p.photo_url}
                to={googlePlaceDetailPath(p.place_id, {
                  back: `/cities/${city_id}/places?category=${category}`,
                  cityId: city_id,
                })}
              />
            ))
          : null}
      </div>
    </section>
  );
}
