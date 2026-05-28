import { Headphones, MapPin, Navigation, Volume2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { useSpeech } from '../hooks/use-speech';
import { formatApiError } from '../lib/api';
import { fetchNarrationAudio } from '../services/ai-service';
import { computeGoogleRoute, fetchGooglePlaceDetail } from '../services/google-service';
import type { GooglePlaceDetail } from '../types/google';
export default function GooglePlaceDetailPage(): ReactElement {
  const { placeId } = useParams();
  const [searchParams] = useSearchParams();
  const [place, setPlace] = useState<GooglePlaceDetail | null>(null);
  const [error, setError] = useState('');
  const [routeMsg, setRouteMsg] = useState('');
  const [routePolyline, setRoutePolyline] = useState('');
  const { speak, stop, speaking, supported } = useSpeech();
  const [narrationSources, setNarrationSources] = useState<{ title: string; url: string }[]>([]);

  const backMap = searchParams.get('from') === 'map' ? '/map' : -1;

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGooglePlaceDetail(placeId);
        if (!cancelled) setPlace(data);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [placeId, stop]);

  const handleRoute = () => {
    if (!place) return;
    setRouteMsg('');
    if (!navigator.geolocation) {
      setRouteMsg('Konum servisi desteklenmiyor.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const route = await computeGoogleRoute({
            origin_lat: pos.coords.latitude,
            origin_lng: pos.coords.longitude,
            dest_lat: place.lat,
            dest_lng: place.lng,
            travel_mode: 'WALK',
          });
          const mins = Math.round(route.duration_s / 60);
          const km = (route.distance_m / 1000).toFixed(1);
          setRouteMsg(`Yürüyüş: ~${mins} dk · ${km} km`);
          setRoutePolyline(route.encoded_polyline);
          const mapUrl = `/map?destLat=${place.lat}&destLng=${place.lng}&polyline=${encodeURIComponent(route.encoded_polyline)}&from=place`;
          window.location.href = mapUrl;
        } catch (err) {
          setRouteMsg(formatApiError(err));
        }
      },
      () => setRouteMsg('Konum izni gerekli. Tarayıcı ayarlarından izin verin veya haritada manuel başlangıç seçin.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleNarration = async () => {
    if (!place) return;
    try {
      const audio = await fetchNarrationAudio({
        stop_title: place.name,
        description: place.editorial_summary || place.formatted_address,
        language: 'tr',
      });
      if (audio.sources?.length) setNarrationSources(audio.sources);
      if (audio.audio_base64) {
        const bin = atob(audio.audio_base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: audio.content_type });
        const url = URL.createObjectURL(blob);
        const el = new Audio(url);
        await el.play();
      } else {
        speak(audio.script || place.name);
      }
    } catch {
      speak(place.editorial_summary || place.name);
    }
  };

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

  const story = place.editorial_summary || 'Bu mekan için kısa özet henüz yok.';

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <BackButton to={typeof backMap === 'string' ? backMap : undefined} label="Haritaya dön" />

      <header className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95">
        <h1 className="font-display text-3xl font-extrabold text-heritage-ink dark:text-stone-50">{place.name}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {place.formatted_address}
        </p>
        {place.rating != null ? (
          <p className="mt-1 text-sm font-semibold text-stone-600">
            ★ {place.rating}
            {place.user_rating_count ? ` (${place.user_rating_count} değerlendirme)` : ''}
          </p>
        ) : null}
      </header>

      <section className="rounded-[22px] border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Headphones className="h-5 w-5 text-primary" aria-hidden="true" />
            Sesli anlatım
          </h2>
          {supported ? (
            <button
              type="button"
              className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 font-bold text-white"
              onClick={() => (speaking ? stop() : void handleNarration())}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {speaking ? 'Durdur' : 'Dinle'}
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{story}</p>
        {(place.sources.length ? place.sources : narrationSources).map((s) => (
          <p key={s.url || s.title} className="mt-2 text-xs">
            <a className="font-semibold text-primary underline" href={s.url} rel="noopener noreferrer" target="_blank">
              {s.title}
            </a>
          </p>
        ))}
      </section>

      {place.opening_hours ? (
        <p className="text-sm font-semibold text-stone-600">{place.opening_hours}</p>
      ) : null}

      <button
        type="button"
        className="tap-scale flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white"
        onClick={handleRoute}
      >
        <Navigation className="h-5 w-5" aria-hidden="true" />
        Konumumdan rotayı çiz
      </button>

      {routeMsg ? (
        <p className="text-sm font-medium text-stone-600" role="status">
          {routeMsg}
          {routePolyline ? (
            <>
              {' '}
              <Link className="text-primary underline" to={`/map?polyline=${encodeURIComponent(routePolyline)}`}>
                Haritada gör
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {place.website_uri ? (
        <a className="text-sm font-bold text-primary underline" href={place.website_uri} rel="noopener noreferrer" target="_blank">
          Resmi web sitesi
        </a>
      ) : null}
    </article>
  );
}
