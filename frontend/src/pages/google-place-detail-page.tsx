import { MapPin, Navigation } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { LoadingButton } from '../components/ui/loading-button';
import { PlaceNarrationPanel } from '../components/explore/place-narration-panel';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { AddToActiveRouteButton } from '../features/active-route/active-route-planner';
import { RoutePreviewMap } from '../features/map/route-preview-map';
import { resolveGooglePlaceImage } from '../lib/region-images';
import { useI18n } from '../lib/i18n';
import { formatApiError } from '../lib/api';
import { computeGoogleRoute, fetchGooglePlaceDetail } from '../services/google-service';
import type { ComputeRouteResponse, GooglePlaceDetail } from '../types/google';

type TravelMode = 'WALK' | 'DRIVE';
type OriginMode = 'gps' | 'pick';

export default function GooglePlaceDetailPage(): ReactElement {
  const { t } = useI18n();
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [place, setPlace] = useState<GooglePlaceDetail | null>(null);
  const [error, setError] = useState('');
  const [routeError, setRouteError] = useState('');
  const { run: runRoute, loading: routeLoading } = useSubmitLock();
  const [route, setRoute] = useState<ComputeRouteResponse | null>(null);
  const [userOrigin, setUserOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [originMode, setOriginMode] = useState<OriginMode>('gps');
  const [pickOriginActive, setPickOriginActive] = useState(false);
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  const [travelMode, setTravelMode] = useState<TravelMode>('WALK');
  const [routeStep, setRouteStep] = useState<1 | 2 | 3>(1);

  const backTo = searchParams.get('back') || (searchParams.get('from') === 'map' ? '/map' : '/cities');

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
    };
  }, [placeId]);

  const computeFromOrigin = async (origin: { lat: number; lng: number }) => {
    if (!place) return;
    setUserOrigin(origin);
    const result = await computeGoogleRoute({
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_lat: place.lat,
      dest_lng: place.lng,
      travel_mode: travelMode,
      waypoints,
    });
    setRoute(result);
  };

  const handleRoute = () => {
    if (!place) return;
    setRouteError('');
    setRoute(null);

    if (originMode === 'pick') {
      if (!userOrigin) {
        setPickOriginActive(true);
        setRouteError('Haritada başlangıç noktasına dokunun, ardından tekrar deneyin.');
        return;
      }
      void runRoute(async () => {
        try {
          await computeFromOrigin(userOrigin);
        } catch (err) {
          setRouteError(formatApiError(err));
        }
      });
      return;
    }

    if (!navigator.geolocation) {
      setRouteError('Konum servisi desteklenmiyor.');
      return;
    }
    void runRoute(async () => {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await computeFromOrigin({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            } catch (err) {
              setRouteError(formatApiError(err));
            }
            resolve();
          },
          () => {
            setRouteError('Konum izni gerekli. Haritadan başlangıç seçmeyi deneyin.');
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

  const narrationDescription = place
    ? [place.editorial_summary, place.formatted_address].filter(Boolean).join('\n')
    : '';

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

      <div className="overflow-hidden rounded-[22px] border border-stone-900/10 dark:border-white/10">
        <img
          src={resolveGooglePlaceImage(place.photo_url, place.name)}
          alt={place.name}
          className="aspect-[16/10] w-full object-cover"
        />
      </div>

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

      <PlaceNarrationPanel stopTitle={place.name} description={narrationDescription} />

      <AddToActiveRouteButton
        title={place.name}
        latitude={place.lat}
        longitude={place.lng}
        description={narrationDescription}
        googlePlaceId={place.place_id}
        className="mb-2"
      />

      <section className="space-y-4 rounded-[22px] border border-stone-900/10 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/95">
        <h2 className="font-display text-lg font-bold">{t('route.planTitle', 'Rota planla')}</h2>

        <div className="space-y-3">
          <div className="rounded-xl border border-stone-900/10 p-3 dark:border-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              {t('route.step1', '1) Başlangıç')}
            </p>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              {t('route.step1Hint', 'Konumunuzu veya haritadan bir başlangıç noktası seçin.')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={`tap-scale min-h-[44px] rounded-full px-4 text-sm font-semibold ${
                  originMode === 'gps' ? 'bg-primary text-white' : 'border border-stone-300 dark:border-zinc-600'
                }`}
                onClick={() => {
                  setOriginMode('gps');
                  setRouteStep(2);
                }}
              >
                {t('route.myLocation', 'Konumum')}
              </button>
              <button
                type="button"
                className={`tap-scale min-h-[44px] rounded-full px-4 text-sm font-semibold ${
                  originMode === 'pick' ? 'bg-primary text-white' : 'border border-stone-300 dark:border-zinc-600'
                }`}
                onClick={() => {
                  setOriginMode('pick');
                  setPickOriginActive(true);
                  setRouteStep(2);
                }}
              >
                {t('route.pickOnMap', 'Haritadan seç')}
              </button>
            </div>
          </div>

          {routeStep >= 2 ? (
            <div className="rounded-xl border border-stone-900/10 p-3 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {t('route.step2', '2) Ara durak (isteğe bağlı)')}
              </p>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                {t('route.step2Hint', 'Yolda uğramak istediğiniz bir nokta ekleyebilirsiniz.')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tap-scale min-h-[44px] rounded-full border border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600"
                  onClick={() => {
                    if (userOrigin) setWaypoints((w) => [...w, userOrigin]);
                    setRouteStep(3);
                  }}
                  disabled={!userOrigin}
                >
                  {t('route.addWaypoint', 'Ara durak ekle')}
                </button>
                {waypoints.length > 0 ? (
                  <button
                    type="button"
                    className="tap-scale min-h-[44px] rounded-full border border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600"
                    onClick={() => setWaypoints([])}
                  >
                    {t('route.clearWaypoints', 'Temizle')} ({waypoints.length})
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tap-scale min-h-[44px] rounded-full px-4 text-sm font-semibold text-primary underline"
                    onClick={() => setRouteStep(3)}
                  >
                    {t('route.skipWaypoint', 'Atla →')}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {routeStep >= 3 ? (
            <div className="rounded-xl border border-stone-900/10 p-3 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {t('route.step3', '3) Rotayı çiz')}
              </p>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                {t('route.step3Hint', 'Yürüyüş veya araç modunu seçip rotayı hesaplayın.')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['WALK', 'DRIVE'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`tap-scale min-h-[44px] rounded-full px-4 text-sm font-semibold ${
                      travelMode === mode ? 'bg-primary text-white' : 'border border-stone-300 dark:border-zinc-600'
                    }`}
                    onClick={() => setTravelMode(mode)}
                  >
                    {mode === 'WALK' ? t('route.walk', 'Yürüyüş') : t('route.drive', 'Araç')}
                  </button>
                ))}
              </div>
              <LoadingButton
                className="mt-3 w-full"
                type="button"
                loading={routeLoading}
                loadingLabel={t('route.calculating', 'Rota hesaplanıyor…')}
                onClick={handleRoute}
              >
                <Navigation className="h-5 w-5" aria-hidden="true" />
                {t('route.drawRoute', 'Rotayı çiz')}
              </LoadingButton>
            </div>
          ) : null}
        </div>
        {routeError ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {routeError}
          </p>
        ) : null}
        {originMode === 'pick' && !route?.encoded_polyline ? (
          <RoutePreviewMap
            dest={{ lat: place.lat, lng: place.lng, title: place.name }}
            encodedPolyline=""
            origin={userOrigin}
            pickOrigin={pickOriginActive}
            waypoints={waypoints}
            onPickOrigin={(lat, lng) => {
              setUserOrigin({ lat, lng });
              setPickOriginActive(false);
              setRouteError('');
            }}
          />
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
              pickOrigin={pickOriginActive && originMode === 'pick'}
              waypoints={waypoints}
              onPickOrigin={(lat, lng) => {
                setUserOrigin({ lat, lng });
                setPickOriginActive(false);
                setRouteError('');
              }}
            />
            {route.steps.length > 0 ? (
              <ol className="max-h-40 space-y-1 overflow-auto text-xs text-stone-600 dark:text-stone-400">
                {route.steps.slice(0, 8).map((step, i) => (
                  <li key={i}>{step.instruction || `Adım ${i + 1}`}</li>
                ))}
              </ol>
            ) : null}
            <a
              className="tap-scale flex w-full min-h-[44px] items-center justify-center rounded-xl border-2 border-stone-300 text-sm font-bold text-stone-800 dark:border-zinc-600"
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}${userOrigin ? `&origin=${userOrigin.lat},${userOrigin.lng}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('route.openInGoogleMaps', "Google Maps'te aç")}
            </a>
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
