import { Headphones, Heart, HeartOff, MapPin, Navigation, Volume2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { getRichPlaceContent } from '../data/place-rich-content';
import { useSpeech } from '../hooks/use-speech';
import { formatApiError } from '../lib/api';
import { getPlace } from '../services/place-service';
import { addFavorite, listFavorites, removeFavorite } from '../services/favorite-service';
import { PLACE_CATEGORY_LABELS, type PlaceResponse } from '../types/place';
import { useAuthStore } from '../stores/auth-store';

export default function PlaceDetailPage(): ReactElement {
  const { placeId } = useParams();
  const id = Number(placeId);
  const { speak, stop, speaking, supported } = useSpeech();
  const [place, setPlace] = useState<PlaceResponse | null>(null);
  const [error, setError] = useState('');
  const accessToken = useAuthStore((s) => s.accessToken);
  const [fav, setFav] = useState(false);

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
      stop();
    };
  }, [id, stop, accessToken]);

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
  const fullNarration = `${place.name}. ${PLACE_CATEGORY_LABELS[place.category]}. ${place.district}, ${place.city}. ${story}`;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <BackButton to="/map" label="Haritaya dön" />

      <header className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
          {PLACE_CATEGORY_LABELS[place.category]}
          {place.is_partner ? ' · Partner' : ''}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-heritage-ink dark:text-stone-50">
          {place.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {place.district}, {place.city}
          </p>
          {accessToken ? (
            <button
              type="button"
              className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-900/10 bg-white px-4 text-sm font-bold text-stone-800 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100"
              onClick={async () => {
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
              }}
            >
              {fav ? <HeartOff className="h-4 w-4" aria-hidden="true" /> : <Heart className="h-4 w-4" aria-hidden="true" />}
              {fav ? 'Favoriden çıkar' : 'Favoriye ekle'}
            </button>
          ) : null}
        </div>
        {place.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {place.tags.map((t) => (
              <span key={t} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <section className="rounded-[22px] border border-primary/20 bg-primary/5 p-5 dark:border-primary/30 dark:bg-primary/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Headphones className="h-5 w-5 text-primary" aria-hidden="true" />
            Sesli anlatım
          </h2>
          {supported ? (
            <button
              type="button"
              className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 font-bold text-white"
              onClick={() => (speaking ? stop() : speak(fullNarration))}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {speaking ? 'Durdur' : 'Dinle'}
            </button>
          ) : (
            <p className="text-xs text-stone-500">Tarayıcınız sesli okumayı desteklemiyor.</p>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{story}</p>
      </section>

      {hours ? (
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">{hours}</p>
      ) : null}

      <section className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
        <h2 className="font-display text-lg font-bold">Pratik ipuçları</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700 dark:text-stone-300">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <Link
        className="tap-scale flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white"
        to={`/map?destLat=${place.latitude}&destLng=${place.longitude}&city=${encodeURIComponent(place.city)}`}
      >
        <Navigation className="h-4 w-4" aria-hidden="true" />
        Haritada rota çiz
      </Link>
    </article>
  );
}
