import type { ReactElement } from 'react';

import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { BackButton } from '../components/ui/back-button';
import { ExploreMap } from '../features/map/explore-map';
import {
  MapActiveRouteSection,
  MapControlsPanel,
  useActiveRouteMap,
  useMapFilters,
  useMapSession,
} from '../features/map-session';
import { usePlacesQuery } from '../hooks/use-places-query';
import { usePlaceCategoryLabels } from '../hooks/use-place-category-labels';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { fetchGooglePlacesNearby } from '../services/google-service';
import { fetchRegionGooglePlaces } from '../services/region-venues-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import { type PlaceCategory } from '../types/place';
import { filterGoogleByCity, filterGoogleByDistrict } from '../utils/district-filter';
import { isValidMapCenter } from '../utils/map-coords';
import { decodePolyline } from '../utils/polyline';

export default function MapPage(): ReactElement {
  const { t } = useI18n();
  const categoryLabels = usePlaceCategoryLabels();
  const user = useAuthStore((s) => s.user);
  const preferredCity = useOnboardingStore((s) => s.preferredCity);

  const { data: routes = [], isPending, isError, error } = useRoutesQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const effectiveCityName =
    searchParams.get('city') ?? user?.preferred_city ?? preferredCity ?? 'İstanbul';
  const district = searchParams.get('district');
  const cityIdParam = Number(searchParams.get('cityId'));
  const districtIdParam = Number(searchParams.get('districtId'));
  const categoryParam = (searchParams.get('category') as PlaceCategory | null) ?? null;
  const routeParam = Number(searchParams.get('route'));
  const activeParam = searchParams.get('active') === '1';
  const polylineParam = searchParams.get('polyline');

  const {
    categoryFilter,
    setCategoryFilter,
    showPlaces,
    setShowPlaces,
    placesRadius,
    setPlacesRadius,
    allCategories: ALL_CATEGORIES,
  } = useMapFilters(categoryParam, districtIdParam);

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasGoogleKey = Boolean(googleKey?.trim());
  const [googlePlacesError, setGooglePlacesError] = useState('');

  const { resolvedDistrictName, geoCenter, mapCenter, mapZoom } = useMapSession({
    effectiveCityName,
    district,
    cityIdParam,
    districtIdParam,
    destLatParam: searchParams.get('destLat'),
    destLngParam: searchParams.get('destLng'),
  });

  const activeRoute = useActiveRouteMap({ routeParam, activeParam, searchParams, setSearchParams });
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
  }, [googleNearby, placesRadius, districtIdParam, setPlacesRadius]);

  const sortedGooglePlaces = useMemo(() => {
    let list = googleNearby?.places ?? [];
    if (resolvedDistrictName) {
      list = filterGoogleByDistrict(list, resolvedDistrictName);
    } else if (effectiveCityName) {
      const byCity = filterGoogleByCity(list, effectiveCityName);
      list = byCity.length > 0 ? byCity : list;
    }
    return [...list]
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0)
      .sort(
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

  const { data: places = [] } = usePlacesQuery(categoryFilter, effectiveCityName, resolvedDistrictName || undefined);

  return (
    <section className="min-w-0 w-full space-y-6" aria-labelledby="map-title">
      <BackButton label={t('common.back', 'Geri')} className="mb-1" />

      <header className="space-y-2">
        <h1
          className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink sm:text-3xl md:text-4xl dark:text-stone-50"
          id="map-title"
        >
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

      <MapControlsPanel
        allCategories={ALL_CATEGORIES}
        categoryFilter={categoryFilter}
        categoryLabels={categoryLabels}
        showPlaces={showPlaces}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        onCategoryChange={setCategoryFilter}
        onShowPlacesChange={setShowPlaces}
      />

      {isError ? (
        <div
          className="break-anywhere rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
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

      {isPending ? (
        <p className="text-xs text-stone-500" role="status">
          {t('map.loadingRoutes', 'Rota listesi yükleniyor…')}
        </p>
      ) : null}

      <ExploreMap
        routes={routes}
        places={places}
        userLocation={activeRoute.userLocation}
        activeStops={activeRoute.mergedStops}
        currentStopIndex={activeRoute.currentStopIndex}
        focusRouteId={activeRoute.focusRouteId ?? undefined}
        showPlaces={showPlaces}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        googlePlaces={sortedGooglePlaces}
        routePolyline={routePolyline}
        preferGoogle={hasGoogleKey}
        mapPickActive={activeRoute.mapPickActive}
        onMapPick={(lat, lng) => void activeRoute.handleMapPick(lat, lng)}
      />

      <MapActiveRouteSection
        focusRouteId={activeRoute.focusRouteId}
        routeTitle={activeRoute.routeTitle}
        mergedStops={activeRoute.mergedStops}
        currentStopIndex={activeRoute.currentStopIndex}
        setCurrentStopIndex={activeRoute.setCurrentStopIndex}
        currentStop={activeRoute.currentStop}
        nextStop={activeRoute.nextStop}
        routeNavActive={activeRoute.routeNavActive}
        userLocation={activeRoute.userLocation}
        geoError={activeRoute.geoError}
        completeMsg={activeRoute.completeMsg}
        geofenceMessage={activeRoute.geofenceMessage}
        watching={activeRoute.watching}
        busy={activeRoute.busy}
        accessToken={activeRoute.accessToken}
        mapPickActive={activeRoute.mapPickActive}
        setMapPickActive={activeRoute.setMapPickActive}
        mapPickMsg={activeRoute.mapPickMsg}
        setMapPickMsg={activeRoute.setMapPickMsg}
        onShowMyLocation={activeRoute.showMyLocation}
        onStartRoute={activeRoute.handleStartRoute}
        onCompleteRoute={activeRoute.handleCompleteRoute}
        onResetRoute={activeRoute.handleResetRoute}
      />
    </section>
  );
}
