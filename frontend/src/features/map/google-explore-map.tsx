import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

import type { GooglePlaceSummary } from '../../types/google';
import type { RouteResponse } from '../../types/route';
import type { StopResponse } from '../../types/stop';
import { decodePolyline } from '../../utils/polyline';
import { routeMapPosition } from './route-map-position';

const containerStyle: { width: string; height: string } = {
  width: '100%',
  height: '100%',
};

export interface GoogleExploreMapProps {
  routes: RouteResponse[];
  apiKey: string;
  center: { lat: number; lng: number };
  zoom?: number;
  googlePlaces?: GooglePlaceSummary[];
  userLocation?: { lat: number; lng: number } | null;
  routePolyline?: { lat: number; lng: number }[] | null;
  activeStops?: StopResponse[];
  currentStopIndex?: number;
  onRequestRoute?: (place: GooglePlaceSummary) => void;
  routingPlaceId?: string | null;
  compact?: boolean;
  onLoadFailed?: () => void;
}

export function GoogleExploreMap({
  routes,
  apiKey,
  center,
  zoom = 13,
  googlePlaces = [],
  userLocation = null,
  routePolyline = null,
  activeStops = [],
  currentStopIndex = 0,
  onRequestRoute,
  routingPlaceId = null,
  compact = false,
  onLoadFailed,
}: GoogleExploreMapProps): ReactElement {
  const shellHeight = compact
    ? 'h-[min(42vh,360px)]'
    : 'h-[min(52vh,400px)] sm:h-[min(62vh,480px)] lg:h-[min(70vh,560px)]';
  const navigate = useNavigate();
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'historial-google-maps-script',
    googleMapsApiKey: apiKey,
    version: 'weekly',
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center.lat, center.lng, zoom]);

  useEffect(() => {
    if (loadError) {
      onLoadFailed?.();
    }
  }, [loadError, onLoadFailed]);

  const polyPath = useMemo(() => {
    if (routePolyline && routePolyline.length > 1) return routePolyline;
    if (activeStops.length > 1) {
      return activeStops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
    }
    return [];
  }, [routePolyline, activeStops]);

  const nextStop = activeStops[currentStopIndex] ?? null;

  const userToNextLine = useMemo(() => {
    if (!userLocation || !nextStop) return [];
    return [
      userLocation,
      { lat: nextStop.latitude, lng: nextStop.longitude },
    ];
  }, [userLocation, nextStop]);

  const handleMarkerClick = useCallback(
    (place: GooglePlaceSummary) => {
      navigate(
        `/google-places/${encodeURIComponent(place.place_id)}?back=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`,
      );
    },
    [navigate],
  );

  if (loadError) {
    return (
      <div className={`flex ${shellHeight} items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-center text-sm text-amber-950`}>
        Google harita açılamadı; OSM haritasına geçiliyor…
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`${shellHeight} animate-pulse rounded-2xl bg-stone-200`}
        aria-busy="true"
        aria-label="Harita yükleniyor"
      />
    );
  }

  return (
    <div className={`relative ${shellHeight} w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-lift`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        mapContainerClassName="rounded-2xl"
        onLoad={setMap}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          mapTypeId: 'roadmap',
          streetViewControl: true,
          zoomControl: true,
        }}
      >
        {activeStops.map((stop, idx) => (
          <Marker
            key={stop.stop_id}
            position={{ lat: stop.latitude, lng: stop.longitude }}
            title={stop.title}
            label={{
              text: String(idx + 1),
              color: idx === currentStopIndex ? '#fff' : '#1c1917',
              fontWeight: '700',
            }}
            icon={
              idx === currentStopIndex
                ? {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#b45309',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                  }
                : undefined
            }
          />
        ))}
        {userLocation ? (
          <Marker
            position={userLocation}
            title="Konumunuz"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
        ) : null}
        {routes.map((route) => {
          const { lat, lng } = routeMapPosition(route.route_id);
          return <Marker key={route.route_id} position={{ lat, lng }} title={route.title} />;
        })}
        {googlePlaces.map((place) => (
          <Marker
            key={place.place_id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => handleMarkerClick(place)}
          />
        ))}
        {polyPath.length > 1 ? (
          <Polyline
            path={polyPath}
            options={{
              strokeColor: '#b45309',
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
        ) : null}
        {userToNextLine.length > 1 ? (
          <Polyline
            path={userToNextLine}
            options={{
              strokeColor: '#2563eb',
              strokeOpacity: 0.85,
              strokeWeight: 4,
              icons: [
                {
                  icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3 },
                  offset: '50%',
                },
              ],
            }}
          />
        ) : null}
      </GoogleMap>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-xs text-stone-700 shadow-md backdrop-blur dark:bg-zinc-900/90 dark:text-stone-300">
        {nextStop && userLocation
          ? `Sıradaki durak: ${nextStop.title}`
          : googlePlaces.length
            ? `${googlePlaces.length} canlı pin. Pin’e dokunun → detay ve rota.`
            : 'Bu bölgede sonuç yok; yarıçapı artırmayı veya kategori değiştirmeyi deneyin.'}
        {onRequestRoute && routingPlaceId ? ' · Rota hesaplanıyor…' : ''}
      </div>
    </div>
  );
}

export { decodePolyline };
