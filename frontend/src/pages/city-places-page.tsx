import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { GoogleVenuePlaceCard } from '../components/explore/google-venue-place-card';
import { VenuePlaceCard } from '../components/explore/venue-place-card';
import { RegionInlineMap } from '../features/map/region-inline-map';
import { googlePlaceDetailPath } from '../lib/routes';
import { listCities } from '../services/city-service';
import { fetchGeoCenter } from '../services/google-service';
import { fetchRegionGooglePlaces } from '../services/region-venues-service';
import { listPlaces } from '../services/place-service';
import type { PlaceCategory } from '../types/place';
import { PLACE_CATEGORY_LABELS } from '../types/place';

export default function CityPlacesPage(): ReactElement {
  const { cityId } = useParams();
  const city_id = Number(cityId);
  const [searchParams] = useSearchParams();
  const category = (searchParams.get('category') as PlaceCategory | null) ?? null;
  const [q, setQ] = useState('');

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
    <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="cityp-title">
      <BackButton to={city ? `/cities/${city.city_id}` : '/cities'} />
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="cityp-title">
          {city?.name_tr ?? 'Şehir'} {category ? `· ${PLACE_CATEGORY_LABELS[category]}` : ''}
        </h1>
        <p className="text-sm text-theme-muted">Şehir genelinde mekanlar</p>
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
          placeholder="Mekan ara"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isPending || googlePending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {isError ? (
        <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
          Mekanlar yüklenemedi.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {places.map((p) => (
          <VenuePlaceCard
            key={p.place_id}
            placeId={p.place_id}
            name={p.name}
            category={p.category}
            subtitle={p.description || `${p.district} / ${p.city}`}
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
                subtitle={p.address}
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
