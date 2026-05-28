import { Headphones, Loader2, MapPin, Navigation, Volume2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { LoadingButton } from '../components/ui/loading-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { RoutePreviewMap } from '../features/map/route-preview-map';
import { langToSpeechCode, playAudioBase64, useSpeech } from '../hooks/use-speech';
import { formatApiError } from '../lib/api';
import { fetchNarrationAudio, fetchNarrationPreview } from '../services/ai-service';
import { computeGoogleRoute, fetchGooglePlaceDetail } from '../services/google-service';
import type { ComputeRouteResponse, GooglePlaceDetail } from '../types/google';

type TravelMode = 'WALK' | 'DRIVE';

export default function GooglePlaceDetailPage(): ReactElement {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [place, setPlace] = useState<GooglePlaceDetail | null>(null);
  const [error, setError] = useState('');
  const [story, setStory] = useState('');
  const [narrationNote, setNarrationNote] = useState('');
  const [routeError, setRouteError] = useState('');
  const { run: runRoute, loading: routeLoading } = useSubmitLock();
  const { run: runNarration, loading: narrationBusy } = useSubmitLock();
  const [route, setRoute] = useState<ComputeRouteResponse | null>(null);
  const [userOrigin, setUserOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('WALK');
  const { speak, stop, speaking, supported } = useSpeech();
  const [narrationSources, setNarrationSources] = useState<{ title: string; url: string }[]>([]);

  const backTo = searchParams.get('back') || (searchParams.get('from') === 'map' ? '/map' : '/cities');

  const loadNarration = useCallback(async (detail: GooglePlaceDetail) => {
    try {
      const preview = await fetchNarrationPreview({
        stop_title: detail.name,
        description: [detail.editorial_summary, detail.formatted_address].filter(Boolean).join('\n'),
        languages: ['tr'],
      });
      const text = preview.scripts.tr || preview.scripts.en || Object.values(preview.scripts)[0] || '';
      if (text) setStory(text);
      if (preview.note) setNarrationNote(preview.note);
      const sources = preview.sources?.length ? preview.sources : detail.sources;
      setNarrationSources(sources);
    } catch {
      if (detail.editorial_summary) setStory(detail.editorial_summary);
      else setStory(`${detail.name} — ${detail.formatted_address}`);
      setNarrationSources(detail.sources);
    }
  }, []);

  useEffect(() => {
    if (!placeId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGooglePlaceDetail(placeId);
        if (!cancelled) {
          setPlace(data);
          if (data.editorial_summary) setStory(data.editorial_summary);
          setNarrationSources(data.sources);
          void loadNarration(data);
        }
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [placeId, stop, loadNarration]);

  const handleRoute = () => {
    if (!place) return;
    setRouteError('');
    setRoute(null);
    if (!navigator.geolocation) {
      setRouteError('Konum servisi desteklenmiyor.');
      return;
    }
    void runRoute(async () => {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserOrigin(origin);
            try {
              const result = await computeGoogleRoute({
                origin_lat: origin.lat,
                origin_lng: origin.lng,
                dest_lat: place.lat,
                dest_lng: place.lng,
                travel_mode: travelMode,
              });
              setRoute(result);
              resolve();
            } catch (err) {
              setRouteError(formatApiError(err));
              resolve();
            }
          },
          () => {
            setRouteError('Konum izni gerekli. Tarayıcı ayarlarından konuma izin verin.');
            resolve();
          },
          { enableHighAccuracy: true, timeout: 15000 },
        );
      });
    });
  };

  const openFullMap = () => {
    if (!place || !route?.encoded_polyline) return;
    const q = new URLSearchParams({
      polyline: route.encoded_polyline,
      destLat: String(place.lat),
      destLng: String(place.lng),
      cityId: searchParams.get('cityId') ?? '',
    });
    navigate(`/map?${q.toString()}`);
  };

  const handleNarration = () => {
    if (!place) return;
    void runNarration(async () => {
      try {
        const audio = await fetchNarrationAudio({
          stop_title: place.name,
          description: story || place.formatted_address,
          language: 'tr',
        });
        if (audio.sources?.length) setNarrationSources(audio.sources);
        if (audio.script) setStory(audio.script);
        if (audio.audio_base64) {
          await playAudioBase64(audio.audio_base64, audio.content_type);
        } else {
          speak(audio.script || story || place.name, langToSpeechCode('tr'));
        }
      } catch {
        speak(story || place.name, langToSpeechCode('tr'));
      }
    });
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

  const routeSummary =
    route && route.duration_s > 0
      ? `${travelMode === 'WALK' ? 'Yürüyüş' : 'Araç'} · ~${Math.max(1, Math.round(route.duration_s / 60))} dk · ${(route.distance_m / 1000).toFixed(1)} km`
      : '';

  return (
    <article className="mx-auto max-w-2xl space-y-4 pb-6 sm:space-y-6">
      <BackButton to={backTo} label="Geri" />

      <header className="rounded-[22px] border border-stone-900/10 bg-white/90 p-4 sm:p-6 dark:border-white/10 dark:bg-zinc-900/95">
        <h1 className="font-display text-2xl font-extrabold text-heritage-ink sm:text-3xl dark:text-stone-50">
          {place.name}
        </h1>
        <p className="mt-2 flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{place.formatted_address}</span>
        </p>
        {place.rating != null ? (
          <p className="mt-1 text-sm font-semibold text-stone-600">
            ★ {place.rating}
            {place.user_rating_count ? ` (${place.user_rating_count} değerlendirme)` : ''}
          </p>
        ) : null}
      </header>

      <section className="rounded-[22px] border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Headphones className="h-5 w-5 text-primary" aria-hidden="true" />
            Sesli anlatım
          </h2>
          <button
            type="button"
            className="tap-scale inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
            disabled={narrationBusy}
            onClick={() => (speaking ? stop() : handleNarration())}
          >
            {narrationBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
            {speaking ? 'Durdur' : 'Dinle'}
          </button>
        </div>
        {!story ? (
          <p className="mt-3 text-sm text-stone-500">Anlatım hazırlanıyor…</p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {story || 'Anlatım yükleniyor…'}
          </p>
        )}
        {narrationNote ? <p className="mt-2 text-xs text-stone-500">{narrationNote}</p> : null}
        {narrationSources.map((s) => (
          <p key={s.url || s.title} className="mt-2 text-xs">
            {s.url ? (
              <a className="font-semibold text-primary underline" href={s.url} rel="noopener noreferrer" target="_blank">
                {s.title}
              </a>
            ) : (
              s.title
            )}
          </p>
        ))}
      </section>

      <section className="space-y-3 rounded-[22px] border border-stone-900/10 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/95">
        <h2 className="font-display text-lg font-bold">Rota</h2>
        <div className="flex flex-wrap gap-2">
          {(['WALK', 'DRIVE'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`tap-scale min-h-[44px] rounded-full px-4 text-sm font-semibold ${
                travelMode === mode ? 'bg-primary text-white' : 'border border-stone-300 dark:border-zinc-600'
              }`}
              onClick={() => setTravelMode(mode)}
            >
              {mode === 'WALK' ? 'Yürüyüş' : 'Araç'}
            </button>
          ))}
        </div>
        <LoadingButton
          className="w-full"
          type="button"
          loading={routeLoading}
          loadingLabel="Rota hesaplanıyor…"
          onClick={handleRoute}
        >
          <Navigation className="h-5 w-5" aria-hidden="true" />
          Konumumdan rotayı çiz
        </LoadingButton>
        {routeError ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {routeError}
          </p>
        ) : null}
        {route?.encoded_polyline ? (
          <>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300" role="status">
              {routeSummary}
            </p>
            <RoutePreviewMap
              dest={{ lat: place.lat, lng: place.lng, title: place.name }}
              encodedPolyline={route.encoded_polyline}
              origin={userOrigin}
            />
            {route.steps.length > 0 ? (
              <ol className="max-h-40 space-y-1 overflow-auto text-xs text-stone-600 dark:text-stone-400">
                {route.steps.slice(0, 8).map((step, i) => (
                  <li key={i}>{step.instruction || `Adım ${i + 1}`}</li>
                ))}
              </ol>
            ) : null}
            <button
              type="button"
              className="tap-scale w-full min-h-[44px] rounded-xl border-2 border-primary text-sm font-bold text-primary"
              onClick={openFullMap}
            >
              Tam ekran haritada aç
            </button>
          </>
        ) : null}
      </section>

      {place.opening_hours ? (
        <p className="text-sm font-semibold text-stone-600">{place.opening_hours}</p>
      ) : null}

      {place.website_uri ? (
        <a className="text-sm font-bold text-primary underline" href={place.website_uri} rel="noopener noreferrer" target="_blank">
          Resmi web sitesi
        </a>
      ) : null}
    </article>
  );
}
