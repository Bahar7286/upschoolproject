import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';

import { useGeofenceWatch, type GeofenceMessages } from '../../../hooks/use-geofence-watch';
import { langToSpeechCode, playAudioBase64, useSpeechSynthesis } from '../../../hooks/use-speech';
import { formatApiError } from '../../../lib/api';
import { useI18n } from '../../../lib/i18n';
import { fetchNarrationAudio } from '../../../services/ai-service';
import { fetchCurrentUser } from '../../../services/auth-service';
import { completeRoute } from '../../../services/profile-service';
import { getRoute } from '../../../services/route-service';
import { listStops } from '../../../services/stop-service';
import { listTripExtraStops } from '../../../services/trip-extra-stop-service';
import { useActiveRouteStore } from '../../../stores/active-route-store';
import { useAuthStore } from '../../../stores/auth-store';
import { useOnboardingStore } from '../../../stores/onboarding-store';
import { useAddPlaceToActiveRoute } from '../../active-route/active-route-planner';

type Params = {
  routeParam: number;
  activeParam: boolean;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
};

export function useActiveRouteMap({ routeParam, activeParam, searchParams, setSearchParams }: Params) {
  const { t } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);

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

  const focusRouteId =
    activeParam && Number.isFinite(routeParam)
      ? routeParam
      : activeRouteId != null
        ? activeRouteId
        : Number.isFinite(routeParam) && routeParam > 0
          ? routeParam
          : undefined;
  const mergedStops = focusRouteId === activeRouteId ? mergedStopsFn() : [];
  const currentStop = mergedStops[currentStopIndex] ?? null;
  const nextStop = mergedStops[currentStopIndex + 1] ?? null;
  const routeNavActive = activeParam && mergedStops.length > 0;

  useEffect(() => {
    if (!Number.isFinite(routeParam) || routeParam <= 0) return;
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
  }, [routeParam, activeRouteId, accessToken, setActiveRoute, mergedStopsFn]);

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
    if (focusRouteId == null || mergedStops.length === 0) return;
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
  }, [t]);

  const handleStartRoute = useCallback(() => {
    if (mergedStops.length === 0) {
      setGeoError(t('map.noStops', 'Başlatılacak durak yok. Önce bir rota seçin veya mekan ekleyin.'));
      return;
    }
    setGeoError('');
    setCompleteMsg(
      t(
        'map.routeStarted',
        'Rota navigasyonu başladı. Durağa yaklaştıkça sesli anlatım tetiklenir; aşağıdaki panelden durakları takip edebilirsiniz.',
      ),
    );
    setCurrentStopIndex(0);
    showMyLocation();
    const params = new URLSearchParams(searchParams);
    params.set('active', '1');
    if (focusRouteId != null) {
      params.set('route', String(focusRouteId));
    }
    setSearchParams(params, { replace: true });
    requestAnimationFrame(() => {
      document.getElementById('map-route-nav')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [
    focusRouteId,
    mergedStops.length,
    searchParams,
    setSearchParams,
    setCurrentStopIndex,
    showMyLocation,
    t,
  ]);

  const handleCompleteRoute = useCallback(async () => {
    if (!accessToken || !focusRouteId) return;
    setBusy(true);
    setCompleteMsg('');
    try {
      const result = await completeRoute(accessToken, focusRouteId);
      setCompleteMsg(
        `Tebrikler! +${result.xp_gained} XP · ${result.level_name}${result.new_badges.length ? ` · Yeni rozet: ${result.new_badges.join(', ')}` : ''}`,
      );
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
  }, [accessToken, focusRouteId, clearActiveRoute, setUser]);

  const handleResetRoute = useCallback(() => {
    clearActiveRoute();
    setCompleteMsg('');
    setCurrentStopIndex(0);
  }, [clearActiveRoute, setCurrentStopIndex]);

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

  return {
    focusRouteId,
    routeTitle,
    mergedStops,
    currentStopIndex,
    setCurrentStopIndex,
    currentStop,
    nextStop,
    routeNavActive,
    userLocation,
    geoError,
    completeMsg,
    busy,
    mapPickActive,
    setMapPickActive,
    mapPickMsg,
    setMapPickMsg,
    geofenceMessage,
    watching,
    accessToken,
    handleMapPick,
    showMyLocation,
    handleStartRoute,
    handleCompleteRoute,
    handleResetRoute,
  };
}
