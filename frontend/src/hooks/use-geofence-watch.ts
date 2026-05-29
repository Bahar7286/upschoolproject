import { useEffect, useRef, useState } from 'react';

import type { StopResponse } from '../types/stop';

const CHECK_INTERVAL_MS = 4000;
const DEFAULT_RADIUS_M = 20;

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeofenceWatch(
  routeId: number | null | undefined,
  stops: StopResponse[],
  onTriggered?: (stopIndex: number, message: string) => void,
  radiusM = DEFAULT_RADIUS_M,
): { geofenceMessage: string; watching: boolean } {
  const [geofenceMessage, setGeofenceMessage] = useState('');
  const [watching, setWatching] = useState(false);
  const lastCheckRef = useRef(0);
  const lastTriggeredIdRef = useRef<number | null>(null);
  const onTriggeredRef = useRef(onTriggered);
  onTriggeredRef.current = onTriggered;

  useEffect(() => {
    lastTriggeredIdRef.current = null;
  }, [routeId, stops.length]);

  useEffect(() => {
    if (!routeId || routeId <= 0 || stops.length === 0) {
      setWatching(false);
      return;
    }
    if (!navigator.geolocation) return;

    setWatching(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastCheckRef.current < CHECK_INTERVAL_MS) return;
        lastCheckRef.current = now;

        const { latitude, longitude } = pos.coords;
        let bestIdx = -1;
        let bestDist: number | null = null;

        stops.forEach((stop, idx) => {
          const dist = distanceMeters(latitude, longitude, stop.latitude, stop.longitude);
          if (bestDist === null || dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });

        if (bestIdx < 0 || bestDist === null) return;
        const nearest = stops[bestIdx];

        if (bestDist <= radiusM) {
          const stopKey = nearest.stop_id;
          if (lastTriggeredIdRef.current !== stopKey) {
            lastTriggeredIdRef.current = stopKey;
            const message = `Sesli rehber tetiklendi: ${nearest.title}`;
            setGeofenceMessage(message);
            onTriggeredRef.current?.(bestIdx, message);
          }
          return;
        }

        setGeofenceMessage(`En yakın: ${nearest.title} (~${Math.round(bestDist)} m)`);
      },
      () => setWatching(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setWatching(false);
    };
  }, [routeId, stops, radiusM]);

  return { geofenceMessage, watching };
}
