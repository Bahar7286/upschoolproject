import { LocateFixed, Navigation, Play } from 'lucide-react';

import type { ReactElement } from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { BackButton } from '../components/ui/back-button';
import { ExploreMap } from '../features/map/explore-map';
import { decodePolyline } from '../utils/polyline';
import { isValidMapCenter, parseOptionalCoord } from '../utils/map-coords';
import { fetchGeoCenter, fetchGooglePlacesNearby } from '../services/google-service';
import { fetchRegionGooglePlaces } from '../services/region-venues-service';
import { listCities, listDistrictsByCity } from '../services/city-service';

import { usePlacesQuery } from '../hooks/use-places-query';

import { useRoutesQuery } from '../hooks/use-routes-query';

import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';

import { useGeofenceWatch, type GeofenceMessages } from '../hooks/use-geofence-watch';
import { langToSpeechCode, playAudioBase64, useSpeechSynthesis } from '../hooks/use-speech';
import { fetchNarrationAudio } from '../services/ai-service';
import { completeRoute } from '../services/profile-service';
import { fetchCurrentUser } from '../services/auth-service';
import { getRoute } from '../services/route-service';
import { listStops } from '../services/stop-service';
import { useOnboardingStore } from '../stores/onboarding-store';
import { useAuthStore } from '../stores/auth-store';

import { ActiveRoutePlanner, useAddPlaceToActiveRoute } from '../features/active-route/active-route-planner';
import { listTripExtraStops } from '../services/trip-extra-stop-service';
import { useActiveRouteStore } from '../stores/active-route-store';

import { filterGoogleByCity, filterGoogleByDistrict } from '../utils/district-filter';

import { usePlaceCategoryLabels } from '../hooks/use-place-category-labels';
import { PLACE_CATEGORY_COLORS, type PlaceCategory } from '../types/place';



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
  const { t } = useI18n();
  const categoryLabels = usePlaceCategoryLabels();
  const user = useAuthStore((s) => s.user);
  const preferredCity = useOnboardingStore((s) => s.preferredCity);

  const { data: routes = [], isPending, isError, error } = useRoutesQuery();

  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | null>(null);

  const [showPlaces, setShowPlaces] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const effectiveCityName =
    searchParams.get('city') ?? user?.preferred_city ?? preferredCity ?? 'İstanbul';
  const city = effectiveCityName;
  const district = searchParams.get('district');
  const cityIdParam = Number(searchParams.get('cityId'));
  const districtIdParam = Number(searchParams.get('districtId'));
  const categoryParam = (searchParams.get('category') as PlaceCategory | null) ?? null;
  const polylineParam = searchParams.get('polyline');
  const destLat = parseOptionalCoord(searchParams.get('destLat'));
  const destLng = parseOptionalCoord(searchParams.get('destLng'));
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasGoogleKey = Boolean(googleKey?.trim());
  const [placesRadius, setPlacesRadius] = useState(() => (districtIdParam > 0 ? 4000 : 10000));
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
    const norm = (s: string) =>
      s
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    const cityNorm = norm(city);
    const found = cities.find(
      (c) => norm(c.name_tr) === cityNorm || c.slug === city.toLowerCase(),
    );
    return found?.city_id;
  }, [cities, city, cityIdParam]);

  const cityFallbackCenter = useMemo(() => {
    if (!resolvedCityId) return null;
    const c = cities.find((x) => x.city_id === resolvedCityId);
    if (!c) return null;
    const center = { lat: c.center_lat, lng: c.center_lng };
    return isValidMapCenter(center) ? center : null;
  }, [cities, resolvedCityId]);

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', resolvedCityId],
    queryFn: () => listDistrictsByCity(resolvedCityId!),
    enabled: Boolean(resolvedCityId && resolvedCityId > 0),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const resolvedDistrictName = useMemo(() => {
    if (district?.trim()) return district;
    if (districtIdParam > 0) {
      return districts.find((d) => d.district_id === districtIdParam)?.name_tr ?? '';
    }
    return '';
  }, [district, districtIdParam, districts]);

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
    if (destLat != null && destLng != null) {
      const dest = { lat: destLat, lng: destLng };
      if (isValidMapCenter(dest)) return dest;
    }
    if (geoCenter && isValidMapCenter(geoCenter)) {
      return { lat: geoCenter.lat, lng: geoCenter.lng };
    }
    if (cityFallbackCenter) return cityFallbackCenter;
    return { lat: 41.015137, lng: 28.97953 };
  }, [geoCenter, destLat, destLng, cityFallbackCenter]);

  const mapZoom = useMemo(() => {
    if (destLat != null) return 15;
    if (districtIdParam > 0) return 14;
    return 12;
  }, [destLat, districtIdParam]);

  const effectiveCategory = categoryFilter ?? categoryParam;

  const { data: googleNearby, isFetching: googleLoading, isError: googleIsError, error: googleQueryError } = useQuery({
    queryKey: ['google-nearby', mapCenter.lat, mapCenter.lng, effectiveCategory, placesRadius, effectiveCityName],
    queryFn: async () => {
      if (effectiveCategory) {
        const places = await fetchRegionGooglePlaces({
          lat: mapCenter.lat,
          lng: mapCenter.lng,
          cityName: effectiveCityName,
          districtName: resolvedDistrictName || undefined,
          category: effectiveCategory,
        });
        return { places, cached: false, radius_m: placesRadius };
      }
      return fetchGooglePlacesNearby({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        radius_m: placesRadius,
        category: null,
      });
    },
    enabled: showPlaces && isValidMapCenter(mapCenter),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (googleIsError) {
      setGooglePlacesError(formatApiError(googleQueryError));
      return;
    }
    if (!googleLoading && googleNearby && googleNearby.places.length === 0) {
      setGooglePlacesError(
        t('map.noLivePins', { city: effectiveCityName }, '{city} için canlı Google pini bulunamadı. Veritabanındaki mekanlar haritada gösteriliyor.'),
      );
      return;
    }
    setGooglePlacesError('');
  }, [googleIsError, googleQueryError, googleNearby, googleLoading, effectiveCityName, t]);

  useEffect(() => {
    if (!googleNearby || districtIdParam > 0) return;
    if (googleNearby.places.length === 0 && placesRadius < 20000) {
      setPlacesRadius((r) => Math.min(r + 5000, 20000));
    }
  }, [googleNearby, placesRadius, districtIdParam]);

  const sortedGooglePlaces = useMemo(() => {
    let list = googleNearby?.places ?? [];
    if (resolvedDistrictName) {
      list = filterGoogleByDistrict(list, resolvedDistrictName);
    } else if (effectiveCityName) {
      const byCity = filterGoogleByCity(list, effectiveCityName);
      list = byCity.length > 0 ? byCity : list;
    }
    return [...list].filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0).sort(
      (a, b) =>
        (b.user_rating_count ?? 0) - (a.user_rating_count ?? 0) ||
        (b.rating ?? 0) - (a.rating ?? 0),
    );
  }, [googleNearby, resolvedDistrictName, effectiveCityName]);

  const routePolyline = useMemo(() => {
    if (!polylineParam) return null;
    try {
      return decodePolyline(polylineParam);
    } catch {
      return null;
    }
  }, [polylineParam]);

  const { data: places = [] } = usePlacesQuery(categoryFilter, city, resolvedDistrictName || undefined);

  const routeParam = Number(searchParams.get('route'));

  const activeParam = searchParams.get('active') === '1';



  const accessToken = useAuthStore((s) => s.accessToken);

  const setUser = useAuthStore((s) => s.setUser);



  const activeRouteId = useActiveRouteStore((s) => s.routeId);
  const routeTitle = useActiveRouteStore((s) => s.routeTitle);
  const setActiveRoute = useActiveRouteStore((s) => s.setActiveRoute);

  const mergedStopsFn = useActiveRouteStore((s) => s.mergedStops);
  const clearActiveRoute = useActiveRouteStore((s) => s.clearActiveRoute);
  const setExtraStops = useActiveRouteStore((s) => s.setExtraStops);

  const currentStopIndex = useActiveRouteStore((s) => s.currentStopIndex);

  const setCurrentStopIndex = useActiveRouteStore((s) => s.setCurrentStopIndex);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [geoError, setGeoError] = useState('');

  const [completeMsg, setCompleteMsg] = useState('');

  const [busy, setBusy] = useState(false);
  const [mapPickActive, setMapPickActive] = useState(false);
  const [mapPickMsg, setMapPickMsg] = useState('');
  const { addPlace } = useAddPlaceToActiveRoute();

  const focusRouteId = activeParam && Number.isFinite(routeParam) ? routeParam : activeRouteId ?? undefined;

  const mergedStops = focusRouteId === activeRouteId ? mergedStopsFn() : [];

  const currentStop = mergedStops[currentStopIndex] ?? null;
  const nextStop = mergedStops[currentStopIndex + 1] ?? null;
  const routeNavActive = activeParam && mergedStops.length > 0;

  useEffect(() => {
    if (!activeParam || !Number.isFinite(routeParam) || routeParam <= 0) return;
    if (activeRouteId === routeParam && mergedStopsFn().length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const [route, stops] = await Promise.all([
          getRoute(routeParam),
          listStops(routeParam, accessToken ?? undefined),
        ]);
        if (!cancelled) setActiveRoute(routeParam, route.title, stops);
      } catch {
        /* rota yüklenemedi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeParam, routeParam, activeRouteId, accessToken, setActiveRoute, mergedStopsFn]);

  useEffect(() => {
    if (!accessToken || !activeRouteId) return;
    let cancelled = false;
    void listTripExtraStops(activeRouteId, accessToken).then((extras) => {
      if (!cancelled) setExtraStops(extras);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, activeRouteId, setExtraStops]);

  const handleMapPick = useCallback(
    async (lat: number, lng: number) => {
      if (!mapPickActive) return;
      setMapPickMsg('');
      const err = await addPlace({
        title: `Ara durak (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
        description: 'Haritadan eklendi',
        insertAfterCurrent: true,
      });
      if (err) {
        setMapPickMsg(err);
        return;
      }
      setMapPickMsg('Ara durak eklendi ✓');
      setMapPickActive(false);
    },
    [addPlace, mapPickActive],
  );

  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const { speak } = useSpeechSynthesis();
  const lastTriggeredStopRef = useRef<number | null>(null);

  const handleGeofenceTriggered = useCallback(
    async (stopIndex: number, message: string) => {
      const stop = mergedStops[stopIndex];
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
    [mergedStops, preferredLanguage, setCurrentStopIndex, speak],
  );

  const geofenceMessages = useMemo<GeofenceMessages>(
    () => ({
      triggered: (title) => t('geofence.triggered', { title }, 'Sesli rehber tetiklendi: {title}'),
      nearest: (title, distanceM) =>
        t('geofence.nearest', { title, distance: Math.round(distanceM) }, 'En yakın: {title} (~{distance} m)'),
    }),
    [t],
  );

  const { geofenceMessage, watching } = useGeofenceWatch(
    focusRouteId ?? undefined,
    mergedStops,
    handleGeofenceTriggered,
    undefined,
    geofenceMessages,
  );

  useEffect(() => {
    lastTriggeredStopRef.current = null;
  }, [focusRouteId]);

  useEffect(() => {
    if (!focusRouteId || mergedStops.length === 0) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* konum izni yoksa sessizce devam */
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [focusRouteId, mergedStops.length]);



  const showMyLocation = useCallback(() => {

    setGeoError('');

    if (!navigator.geolocation) {

      setGeoError(t('map.geoUnsupported', 'Tarayıcınız konum servisini desteklemiyor.'));

      return;

    }

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      },

      () => setGeoError(t('map.geoDenied', 'Konum izni verilmedi veya alınamadı.')),

      { enableHighAccuracy: true, timeout: 10000 },

    );

  }, []);



  const handleStartRoute = useCallback(() => {
    showMyLocation();
    if (focusRouteId != null && focusRouteId > 0) {
      const params = new URLSearchParams(searchParams);
      params.set('route', String(focusRouteId));
      params.set('active', '1');
      setSearchParams(params, { replace: true });
    }
  }, [focusRouteId, searchParams, setSearchParams, showMyLocation]);



  const handleCompleteRoute = async () => {

    if (!accessToken || !focusRouteId) return;

    setBusy(true);

    setCompleteMsg('');

    try {

      const result = await completeRoute(accessToken, focusRouteId);

      setCompleteMsg(`Tebrikler! +${result.xp_gained} XP · ${result.level_name}${result.new_badges.length ? ` · Yeni rozet: ${result.new_badges.join(', ')}` : ''}`);

      const me = await fetchCurrentUser(accessToken);

      setUser(me);
      if (focusRouteId === 0) {
        clearActiveRoute();
      }

    } catch (err) {

      setGeoError(formatApiError(err));

    } finally {

      setBusy(false);

    }

  };



  const mapRoutes = useMemo(() => routes, [routes]);



  return (

    <section className="space-y-6" aria-labelledby="map-title">

      <BackButton label={t('common.back', 'Geri')} className="mb-1" />

      <header className="space-y-2">

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink md:text-4xl dark:text-stone-50" id="map-title">

          {t('map.title', 'Canlı harita')}

        </h1>

        <p className="max-w-prose text-sm leading-relaxed text-stone-600 md:text-base dark:text-stone-400">

          {geoCenter?.city_name
            ? t(
                'map.subtitleCity',
                {
                  city: `${geoCenter.district_name ? `${geoCenter.district_name}, ` : ''}${geoCenter.city_name}`,
                },
                '{city} — canlı pinler ve rota navigasyonu',
              )
            : t('map.subtitle', 'Google Places ile canlı pinler. Kategori seçin; sonuç yoksa arama yarıçapı genişler.')}

        </p>

      </header>



      <div className="flex flex-wrap items-center gap-2 sm:gap-2">

        <button

          className={`tap-scale touch-chip text-xs ${categoryFilter === null ? 'bg-primary text-white' : 'border border-stone-900/15 dark:border-white/15'}`}

          type="button"

          onClick={() => setCategoryFilter(null)}

        >

          {t('map.allCategories', 'Tümü')}

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

            {categoryLabels[cat]}

          </button>

        ))}

        <label className="inline-flex min-h-[44px] w-full items-center gap-2 text-sm font-semibold sm:ml-auto sm:w-auto">

          <input checked={showPlaces} type="checkbox" onChange={(e) => setShowPlaces(e.target.checked)} />

          {t('map.poiPins', 'POI pinleri')}

        </label>

      </div>



      {isError ? (

        <div className="break-anywhere rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">

          {formatApiError(error)}

        </div>

      ) : null}



      {googleLoading ? (
        <p className="text-sm text-stone-500" role="status">
          {t('map.loadingPlaces', 'Canlı mekanlar yükleniyor…')}
        </p>
      ) : null}

      {googlePlacesError ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm" role="alert">
          {googlePlacesError}
        </div>
      ) : null}

      {geoError ? (
        <div
          className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-950 dark:text-amber-100"
          role="alert"
        >
          <p>{geoError}</p>
          <p className="mt-2 text-stone-700 dark:text-stone-300">
            Konum olmadan da haritayı kullanabilirsin. Şehir seçerek veya listeden mekanlara göz atarak devam et.
          </p>
          <Link className="mt-2 inline-flex min-h-[44px] items-center font-bold text-primary underline" to="/cities">
            İlleri liste görünümünde keşfet
          </Link>
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
        <p className="text-xs text-stone-500" role="status">
          {t('map.loadingRoutes', 'Rota listesi yükleniyor…')}
        </p>
      ) : null}

      <ExploreMap
        routes={mapRoutes}
        places={places}
        userLocation={userLocation}
        activeStops={mergedStops}
        currentStopIndex={currentStopIndex}
        focusRouteId={focusRouteId ?? undefined}
        showPlaces={showPlaces}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        googlePlaces={sortedGooglePlaces}
        routePolyline={routePolyline}
        preferGoogle={hasGoogleKey}
        mapPickActive={mapPickActive}
        onMapPick={(lat, lng) => void handleMapPick(lat, lng)}
      />



      <div className="responsive-stack">

        <button

          className="tap-scale responsive-btn rounded-xl border-2 border-stone-300 bg-white px-5 text-sm font-semibold hover:border-stone-900 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-white"

          type="button"

          onClick={showMyLocation}

        >

          <LocateFixed className="h-5 w-5" aria-hidden="true" />

          {t('map.myLocation', 'Konumumu göster')}

        </button>

        {focusRouteId != null && mergedStops.length > 0 ? (

          <>

            {!routeNavActive ? (
              <button
                className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                type="button"
                onClick={handleStartRoute}
              >
                <Play className="h-5 w-5" aria-hidden="true" />
                {t('map.startRoute', 'Rotaya başla')}
              </button>
            ) : (
              <>
            <button

              className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"

              type="button"

              disabled={currentStopIndex >= mergedStops.length - 1}

              onClick={() => setCurrentStopIndex(Math.min(currentStopIndex + 1, mergedStops.length - 1))}

            >

              <Navigation className="h-5 w-5" aria-hidden="true" />

              {t('map.nextStop', 'Sonraki durak')}

            </button>
              </>
            )}

            {routeNavActive ? (
              <>

            <button

              className="tap-scale responsive-btn rounded-xl border-2 border-stone-400 px-5 text-sm font-semibold hover:border-stone-900 dark:border-zinc-500"

              type="button"

              onClick={() => {
                clearActiveRoute();
                setCompleteMsg('');
                setCurrentStopIndex(0);
              }}

            >

              {t('map.resetRoute', 'Rotayı sıfırla')}

            </button>

            <button

              className="tap-scale responsive-btn rounded-xl border-2 border-primary px-5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"

              type="button"

              disabled={busy || !accessToken || focusRouteId === 0}

              onClick={handleCompleteRoute}

            >

              {busy ? t('map.saving', 'Kaydediliyor…') : t('map.completeRoute', 'Rotayı tamamla')}

            </button>
              </>
            ) : null}

          </>

        ) : (

          <Link

            className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"

            to="/discover"

          >

            {t('map.pickRoute', 'Rota seç')}

          </Link>

        )}

      </div>



      {focusRouteId && routeTitle ? (

        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">

          <p className="text-xs font-bold uppercase tracking-wider text-primary">{t('map.activeRoute', 'Aktif rota')}</p>

          <h2 className="mt-1 font-display text-lg font-bold">{routeTitle}</h2>

          <div className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3 text-sm dark:bg-zinc-800/80">
            <p className="font-semibold text-stone-700 dark:text-stone-200">
              {t('map.navStatus', 'Navigasyon')}
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              {userLocation
                ? t('map.youAreHere', 'Konumunuz alındı')
                : t('map.locationPending', 'Konum bekleniyor…')}
              {userLocation
                ? ` · ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : ''}
            </p>
            {currentStop ? (
              <p className="text-stone-600 dark:text-stone-400">
                {t('map.currentStop', 'Şu anki durak')}: <strong>{currentStop.title}</strong>
                {' · '}
                {t('map.stopOf', 'Durak {current}/{total}')
                  .replace('{current}', String(currentStopIndex + 1))
                  .replace('{total}', String(mergedStops.length))}
              </p>
            ) : null}
            {nextStop ? (
              <p className="text-stone-600 dark:text-stone-400">
                {t('map.headingTo', 'Gidilecek')}: <strong>{nextStop.title}</strong>
              </p>
            ) : null}
          </div>

          {currentStop ? (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {t('map.stopOf', 'Durak {current}/{total}')
                .replace('{current}', String(currentStopIndex + 1))
                .replace('{total}', String(mergedStops.length))}
              : <strong>{currentStop.title}</strong>
            </p>
          ) : null}
          {focusRouteId && mergedStops.length > 0 && routeNavActive ? (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {t('map.geofenceHint', 'Geofence aktif (~20 m) — durağa yaklaşınca sesli anlatım tetiklenir.')}
            </p>
          ) : null}

          {focusRouteId && mergedStops.length > 0 ? (
            <div className="mt-4 border-t border-stone-900/10 pt-4 dark:border-white/10">
              <button
                type="button"
                className={`tap-scale mb-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 px-4 text-sm font-bold ${
                  mapPickActive
                    ? 'border-amber-600 bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'
                    : 'border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/40'
                }`}
                onClick={() => {
                  setMapPickMsg('');
                  setMapPickActive((v) => !v);
                }}
              >
                {mapPickActive ? t('map.cancelMapPick', 'İptal — harita seçimi') : t('map.addWaypoint', 'Ara durak ekle (haritaya dokun)')}
              </button>
              {mapPickActive ? (
                <p className="mb-3 text-xs font-semibold text-amber-800 dark:text-amber-200" role="status">
                  {t('map.mapPickHint', 'Haritada eklemek istediğiniz noktaya dokunun.')}
                </p>
              ) : null}
              {mapPickMsg ? (
                <p
                  className={`mb-3 text-xs font-medium ${mapPickMsg.includes('✓') ? 'text-primary' : 'text-red-700'}`}
                  role="status"
                >
                  {mapPickMsg}
                </p>
              ) : null}
              <ActiveRoutePlanner
                mergedStops={mergedStops}
                currentStopIndex={currentStopIndex}
                onSelectStop={setCurrentStopIndex}
              />
            </div>
          ) : null}

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">

            <div

              className="h-full rounded-full bg-primary transition-all"

              style={{ width: mergedStops.length ? `${((currentStopIndex + 1) / mergedStops.length) * 100}%` : '0%' }}

            />

          </div>

          <Link className="tap-scale mt-4 inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline" to={`/routes/${focusRouteId}`}>

            {t('map.routeDetail', 'Rota detayına git')}

          </Link>

        </div>

      ) : null}

    </section>

  );

}


