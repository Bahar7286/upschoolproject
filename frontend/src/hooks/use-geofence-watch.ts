import { useEffect, useRef, useState } from 'react';

import { checkGeofence } from '../services/ai-service';
import type { StopResponse } from '../types/stop';

const CHECK_INTERVAL_MS = 8000;

export function useGeofenceWatch(
  routeId: number | null | undefined,
  stops: StopResponse[],
  onTriggered?: (stopIndex: number, message: string) => void,
): { geofenceMessage: string; watching: boolean } {
  const [geofenceMessage, setGeofenceMessage] = useState('');
  const [watching, setWatching] = useState(false);
  const lastCheckRef = useRef(0);
  const onTriggeredRef = useRef(onTriggered);
  onTriggeredRef.current = onTriggered;

  useEffect(() => {
    if (!routeId || routeId <= 0 || stops.length === 0) {
      setWatching(false);
      return;
    }
    if (!navigator.geolocation) return;

    setWatching(true);
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastCheckRef.current < CHECK_INTERVAL_MS) return;
        lastCheckRef.current = now;

        try {
          const res = await checkGeofence({
            route_id: routeId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            radius_m: 20,
          });
          if (!res.triggered || res.stop_id == null) {
            if (res.distance_m != null && res.stop_title) {
              setGeofenceMessage(
                `En yakın: ${res.stop_title} (~${Math.round(res.distance_m)} m)`,
              );
            }
            return;
          }
          const idx = stops.findIndex((s) => s.stop_id === res.stop_id);
          setGeofenceMessage(res.message);
          if (idx >= 0) {
            onTriggeredRef.current?.(idx, res.message);
          }
        } catch {
          /* konum kontrolü sessizce atlanır */
        }
      },
      () => setWatching(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setWatching(false);
    };
  }, [routeId, stops]);

  return { geofenceMessage, watching };
}
