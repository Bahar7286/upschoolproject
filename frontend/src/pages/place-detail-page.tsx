import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AddToActiveRouteButton } from '../features/active-route/active-route-planner';
import { AlsoVisitedPanel } from '../components/explore/also-visited-panel';
import { DirectionsCta, VenueDetailHero } from '../components/explore/venue-detail-hero';
import { PlaceNarrationPanel } from '../components/explore/place-narration-panel';
import { useRecordPlaceVisit } from '../hooks/use-record-place-visit';
import { getRichPlaceContent } from '../data/place-rich-content';
import { resolvePlaceImage } from '../lib/region-images';
import { formatApiError } from '../lib/api';
import { listCities } from '../services/city-service';
import { getPlace } from '../services/place-service';
import { addFavorite, listFavorites, removeFavorite } from '../services/favorite-service';
import type { PlaceResponse } from '../types/place';
import { useAuthStore } from '../stores/auth-store';

export default function PlaceDetailPage(): ReactElement {
  const { placeId } = useParams();
  const id = Number(placeId);
  const [place, setPlace] = useState<PlaceResponse | null>(null);
  const [error, setError] = useState('');
  const accessToken = useAuthStore((s) => s.accessToken);
  const [fav, setFav] = useState(false);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const cityRow = useMemo(
    () => (place ? cities.find((c) => c.name_tr === place.city) : null),
    [cities, place],
  );

  useEffect(() => {
    if (!id || id <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getPlace(id);
        if (!cancelled) setPlace(data);
        if (!cancelled && accessToken) {
          const favs = await listFavorites(accessToken).catch(() => []);
          setFav(favs.some((f) => f.entity_type === 'place' && f.entity_id === id));
        }
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, accessToken]);

  useRecordPlaceVisit(
    accessToken,
    id > 0
      ? {
          entity_type: 'place',
          entity_key: String(id),
          source: 'view',
        }
      : null,
  );

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
        {error}
      </p>
    );
  }

  if (!place) {
    return <div className="h-48 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" aria-busy="true" />;
  }

  const { story, tips, hours } = getRichPlaceContent(place.name, place.category, place.description);
  const narrationContext = `${story} ${place.description}`.trim();
  const backTo = cityRow ? `/cities/${cityRow.city_id}` : '/cities';

  return (
    <article className="mx-auto max-w-2xl space-y-5 pb-8">
      <VenueDetailHero
        title={place.name}
        locationLine={`${place.district}, ${place.city}`}
        imageUrl={resolvePlaceImage(place.place_id, place.category, place.image_url)}
        backTo={backTo}
        favorited={fav}
        onFavorite={
          accessToken
            ? async () => {
                try {
                  if (!accessToken) return;
                  if (fav) {
                    await removeFavorite(accessToken, 'place', id);
                    setFav(false);
                  } else {
                    await addFavorite(accessToken, 'place', id);
                    setFav(true);
                  }
                } catch (err) {
                  setError(formatApiError(err));
                }
              }
            : undefined
        }
      >
        <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">{story}</p>
        {place.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {place.tags.map((t) => (
              <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </VenueDetailHero>

      <div className="space-y-4 px-3 sm:px-4 md:px-0">
        <section className="rounded-2xl border border-stone-900/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <span aria-hidden="true">🌍</span> Konum
          </h2>
          <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:bg-zinc-800 dark:text-stone-300">
            {place.name} — {place.district}, {place.city}
          </p>
        </section>

        <AddToActiveRouteButton
          title={place.name}
          latitude={place.latitude}
          longitude={place.longitude}
          description={story}
          placeId={place.place_id}
        />

        <DirectionsCta lat={place.latitude} lng={place.longitude} />

        <PlaceNarrationPanel stopTitle={place.name} description={narrationContext} />

        <AlsoVisitedPanel entityType="place" placeId={place.place_id} placeName={place.name} city={place.city} />

        {hours ? <p className="text-sm font-semibold text-stone-600">{hours}</p> : null}

        {tips.length ? (
          <section className="rounded-2xl border border-stone-900/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
            <h2 className="font-display text-lg font-bold">Pratik ipuçları</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700 dark:text-stone-300">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link
          className="tap-scale flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-primary font-bold text-primary"
          to={`/map?destLat=${place.latitude}&destLng=${place.longitude}&city=${encodeURIComponent(place.city)}`}
        >
          Uygulama içi haritada rota
        </Link>
      </div>
    </article>
  );
}
