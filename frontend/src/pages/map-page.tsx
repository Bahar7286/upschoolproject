import { LocateFixed, Navigation } from 'lucide-react';

import type { ReactElement } from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { BackButton } from '../components/ui/back-button';
import { ExploreMap } from '../features/map/explore-map';
import { decodePolyline } from '../utils/polyline';
import { fetchGeoCenter, fetchGooglePlacesNearby } from '../services/google-service';
import { listCities } from '../services/city-service';

import { usePlacesQuery } from '../hooks/use-places-query';

import { useRoutesQuery } from '../hooks/use-routes-query';

import { formatApiError } from '../lib/api';

import { useGeofenceWatch } from '../hooks/use-geofence-watch';
import { langToSpeechCode, playAudioBase64, useSpeechSynthesis } from '../hooks/use-speech';
import { fetchNarrationAudio } from '../services/ai-service';
import { completeRoute } from '../services/profile-service';
import { fetchCurrentUser } from '../services/auth-service';
import { useOnboardingStore } from '../stores/onboarding-store';

import { useActiveRouteStore } from '../stores/active-route-store';

import { useAuthStore } from '../stores/auth-store';

import {

  PLACE_CATEGORY_COLORS,

  PLACE_CATEGORY_LABELS,

  type PlaceCategory,

} from '../types/place';



const ALL_CATEGORIES: PlaceCategory[] = [

  'museum',

  'palace',

  'historical',

  'mosque',

  'bazaar',

  'street',

  'restaurant',

  'accommodation',

];



export default function MapPage(): ReactElement {

  const { data: routes = [], isPending, isError, error } = useRoutesQuery();

  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | null>(null);

  const [showPlaces, setShowPlaces] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const city = searchParams.get('city') ?? 'Istanbul';
  const district = searchParams.get('district');
  const cityIdParam = Number(searchParams.get('cityId'));
  const districtIdParam = Number(searchParams.get('districtId'));
  const categoryParam = (searchParams.get('category') as PlaceCategory | null) ?? null;
  const polylineParam = searchParams.get('polyline');
  const [placesRadius, setPlacesRadius] = useState(8000);
  const [googlePlacesError, setGooglePlacesError] = useState('');

  useEffect(() => {
    if (categoryParam && ALL_CATEGORIES.includes(categoryParam)) {
      setCategoryFilter(categoryParam);
    }
  }, [categoryParam]);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });
  const resolvedCityId = useMemo(() => {
    if (Number.isFinite(cityIdParam) && cityIdParam > 0) return cityIdParam;
    const found = cities.find(
      (c) => c.name_tr.toLowerCase() === city.toLowerCase() || c.slug === city.toLowerCase(),
    );
    return found?.city_id;
  }, [cities, city, cityIdParam]);

  const { data: geoCenter } = useQuery({
    queryKey: ['geo-center', resolvedCityId, districtIdParam],
    queryFn: () =>
      fetchGeoCenter({
        cityId: districtIdParam > 0 ? undefined : resolvedCityId,
        districtId: districtIdParam > 0 ? districtIdParam : undefined,
      }),
    enabled: Boolean((resolvedCityId && resolvedCityId > 0) || (districtIdParam > 0)),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const mapCenter = useMemo(() => {
    if (geoCenter) return { lat: geoCenter.lat, lng: geoCenter.lng };
    return { lat: 41.015137, lng: 28.97953 };
  }, [geoCenter]);

  const effectiveCategory = categoryFilter ?? categoryParam;

  const { data: googleNearby, isFetching: googleLoading } = useQuery({
    queryKey: ['google-nearby', mapCenter.lat, mapCenter.lng, effectiveCategory, placesRadius],
    queryFn: () =>
      fetchGooglePlacesNearby({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        radius_m: placesRadius,
        category: effectiveCategory,
      }),
    enabled: showPlaces,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!googleNearby) return;
    if (googleNearby.places.length === 0 && placesRadius < 15000) {
      setPlacesRadius((r) => Math.min(r + 5000, 15000));
    }
  }, [googleNearby, placesRadius]);

  const routePolyline = useMemo(() => {
    if (!polylineParam) return null;
    try {
      return decodePolyline(polylineParam);
    } catch {
      return null;
    }
  }, [polylineParam]);

  const { data: places = [] } = usePlacesQuery(categoryFilter, city, district);

  const routeParam = Number(searchParams.get('route'));

  const activeParam = searchParams.get('active') === '1';



  const accessToken = useAuthStore((s) => s.accessToken);

  const setUser = useAuthStore((s) => s.setUser);



  const activeRouteId = useActiveRouteStore((s) => s.routeId);

  const routeTitle = useActiveRouteStore((s) => s.routeTitle);

  const stops = useActiveRouteStore((s) => s.stops);

  const currentStopIndex = useActiveRouteStore((s) => s.currentStopIndex);

  const setCurrentStopIndex = useActiveRouteStore((s) => s.setCurrentStopIndex);



  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [geoError, setGeoError] = useState('');

  const [completeMsg, setCompleteMsg] = useState('');

  const [busy, setBusy] = useState(false);

  const focusRouteId = activeParam && Number.isFinite(routeParam) ? routeParam : activeRouteId;

  const activeStops = focusRouteId === activeRouteId ? stops : [];

  const currentStop = activeStops[currentStopIndex] ?? null;

  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const { speak } = useSpeechSynthesis();
  const lastTriggeredStopRef = useRef<number | null>(null);

  const handleGeofenceTriggered = useCallback(
    async (stopIndex: number, message: string) => {
      const stop = activeStops[stopIndex];
      if (!stop) return;
      if (lastTriggeredStopRef.current === stop.stop_id) return;
      lastTriggeredStopRef.current = stop.stop_id;
      setCurrentStopIndex(stopIndex);
      setCompleteMsg(message);
      try {
        const audio = await fetchNarrationAudio({
          stop_title: stop.title,
          description: stop.description || '',
          language: preferredLanguage,
        });
        if (audio.audio_base64) {
          await playAudioBase64(audio.audio_base64);
        } else {
          speak(audio.script || stop.description || stop.title, langToSpeechCode(preferredLanguage));
        }
      } catch {
        speak(stop.description || stop.title, langToSpeechCode(preferredLanguage));
      }
    },
    [activeStops, preferredLanguage, setCurrentStopIndex, speak],
  );

  const { geofenceMessage, watching } = useGeofenceWatch(
    focusRouteId ?? undefined,
    activeStops,
    handleGeofenceTriggered,
  );

  useEffect(() => {
    lastTriggeredStopRef.current = null;
  }, [focusRouteId]);



  const showMyLocation = useCallback(() => {

    setGeoError('');

    if (!navigator.geolocation) {

      setGeoError('Tarayıcınız konum servisini desteklemiyor.');

      return;

    }

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      },

      () => setGeoError('Konum izni verilmedi veya alınamadı.'),

      { enableHighAccuracy: true, timeout: 10000 },

    );

  }, []);



  const handleCompleteRoute = async () => {

    if (!accessToken || !focusRouteId) return;

    setBusy(true);

    setCompleteMsg('');

    try {

      const result = await completeRoute(accessToken, focusRouteId);

      setCompleteMsg(`Tebrikler! +${result.xp_gained} XP · ${result.level_name}${result.new_badges.length ? ` · Yeni rozet: ${result.new_badges.join(', ')}` : ''}`);

      const me = await fetchCurrentUser(accessToken);

      setUser(me);

    } catch (err) {

      setGeoError(formatApiError(err));

    } finally {

      setBusy(false);

    }

  };



  const mapRoutes = useMemo(() => routes, [routes]);



  return (

    <section className="space-y-6" aria-labelledby="map-title">

      <BackButton label="Geri" className="mb-1" />

      <header className="space-y-2">

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink md:text-4xl dark:text-stone-50" id="map-title">

          Canlı harita

        </h1>

        <p className="max-w-prose text-sm leading-relaxed text-stone-600 md:text-base dark:text-stone-400">

          {geoCenter?.city_name
            ? `${geoCenter.district_name ? `${geoCenter.district_name}, ` : ''}${geoCenter.city_name} — `
            : ''}
          Google Places ile canlı pinler. Kategori seçin; sonuç yoksa arama yarıçapı otomatik genişler.

        </p>

      </header>



      <div className="flex flex-wrap items-center gap-2 sm:gap-2">

        <button

          className={`tap-scale touch-chip text-xs ${categoryFilter === null ? 'bg-primary text-white' : 'border border-stone-900/15 dark:border-white/15'}`}

          type="button"

          onClick={() => setCategoryFilter(null)}

        >

          Tümü

        </button>

        {ALL_CATEGORIES.map((cat) => (

          <button

            className={`tap-scale touch-chip gap-1.5 text-xs ${categoryFilter === cat ? 'bg-primary text-white' : 'border border-stone-900/15 dark:border-white/15'}`}

            key={cat}

            type="button"

            onClick={() => {
              const next = categoryFilter === cat ? null : cat;
              setCategoryFilter(next);
              const params = new URLSearchParams(searchParams);
              if (next) params.set('category', next);
              else params.delete('category');
              setSearchParams(params, { replace: true });
            }}

          >

            <span

              className="inline-block h-2 w-2 rounded-full"

              style={{ backgroundColor: PLACE_CATEGORY_COLORS[cat] }}

              aria-hidden="true"

            />

            {PLACE_CATEGORY_LABELS[cat]}

          </button>

        ))}

        <label className="inline-flex min-h-[44px] w-full items-center gap-2 text-sm font-semibold sm:ml-auto sm:w-auto">

          <input checked={showPlaces} type="checkbox" onChange={(e) => setShowPlaces(e.target.checked)} />

          POI pinleri

        </label>

      </div>



      {isError ? (

        <div className="break-anywhere rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">

          {formatApiError(error)}

        </div>

      ) : null}



      {googleLoading ? (
        <p className="text-sm text-stone-500" role="status">
          Canlı mekanlar yükleniyor…
        </p>
      ) : null}

      {googlePlacesError ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm" role="alert">
          {googlePlacesError}
        </div>
      ) : null}

      {geoError ? (

        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-950 dark:text-amber-100" role="alert">

          {geoError}

        </div>

      ) : null}



      {geofenceMessage ? (
        <div
          className="break-anywhere rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary-dark dark:text-primary"
          role="status"
        >
          {watching ? '📍 ' : ''}
          {geofenceMessage}
        </div>
      ) : null}

      {completeMsg ? (
        <div
          className="break-anywhere rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-950 dark:text-amber-100"
          role="status"
        >
          {completeMsg}
        </div>
      ) : null}



      {isPending ? (

        <div className="h-[min(52vh,400px)] animate-pulse rounded-2xl bg-stone-200 sm:h-[min(62vh,480px)] lg:h-[min(70vh,560px)] dark:bg-zinc-800" aria-busy="true" aria-label="Harita yükleniyor" />

      ) : (

        <ExploreMap

          routes={mapRoutes}

          places={places}

          userLocation={userLocation}

          activeStops={activeStops}

          focusRouteId={focusRouteId ?? undefined}

          showPlaces={showPlaces}

          mapCenter={mapCenter}

          mapZoom={districtIdParam > 0 ? 14 : 12}

          googlePlaces={googleNearby?.places ?? []}

          routePolyline={routePolyline}

          preferGoogle

        />

      )}



      <div className="responsive-stack">

        <button

          className="tap-scale responsive-btn rounded-xl border-2 border-stone-300 bg-white px-5 text-sm font-semibold hover:border-stone-900 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-white"

          type="button"

          onClick={showMyLocation}

        >

          <LocateFixed className="h-5 w-5" aria-hidden="true" />

          Konumumu göster

        </button>

        {focusRouteId && activeStops.length > 0 ? (

          <>

            <button

              className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"

              type="button"

              disabled={currentStopIndex >= activeStops.length - 1}

              onClick={() => setCurrentStopIndex(Math.min(currentStopIndex + 1, activeStops.length - 1))}

            >

              <Navigation className="h-5 w-5" aria-hidden="true" />

              Sonraki durak

            </button>

            <button

              className="tap-scale responsive-btn rounded-xl border-2 border-primary px-5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"

              type="button"

              disabled={busy || !accessToken}

              onClick={handleCompleteRoute}

            >

              {busy ? 'Kaydediliyor…' : 'Rotayı tamamla'}

            </button>

          </>

        ) : (

          <Link

            className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"

            to="/discover"

          >

            Rota seç

          </Link>

        )}

      </div>



      {focusRouteId && routeTitle ? (

        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">

          <p className="text-xs font-bold uppercase tracking-wider text-primary">Aktif rota</p>

          <h2 className="mt-1 font-display text-lg font-bold">{routeTitle}</h2>

          {currentStop ? (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Durak {currentStopIndex + 1}/{activeStops.length}: <strong>{currentStop.title}</strong>
            </p>
          ) : null}
          {focusRouteId && activeStops.length > 0 ? (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Geofence aktif (~20 m) — durağa yaklaşınca sesli anlatım tetiklenir.
            </p>
          ) : null}

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">

            <div

              className="h-full rounded-full bg-primary transition-all"

              style={{ width: activeStops.length ? `${((currentStopIndex + 1) / activeStops.length) * 100}%` : '0%' }}

            />

          </div>

          <Link className="tap-scale mt-4 inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline" to={`/routes/${focusRouteId}`}>

            Rota detayına git

          </Link>

        </div>

      ) : null}

    </section>

  );

}


