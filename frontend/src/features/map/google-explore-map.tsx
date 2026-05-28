import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

import type { GooglePlaceSummary } from '../../types/google';
import type { RouteResponse } from '../../types/route';
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
  onRequestRoute?: (place: GooglePlaceSummary) => void;
  routingPlaceId?: string | null;
  compact?: boolean;
}

export function GoogleExploreMap({
  routes,
  apiKey,
  center,
  zoom = 13,
  googlePlaces = [],
  userLocation = null,
  routePolyline = null,
  onRequestRoute,
  routingPlaceId = null,
  compact = false,
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

  const polyPath = useMemo(() => routePolyline ?? [], [routePolyline]);

  const handleMarkerClick = useCallback(
    (place: GooglePlaceSummary) => {
      navigate(`/google-places/${encodeURIComponent(place.place_id)}?back=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    },
    [navigate],
  );

  if (loadError) {
    return (
      <div className="flex h-[min(52vh,400px)] sm:h-[min(62vh,480px)] lg:h-[min(70vh,560px)] items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-center text-sm text-red-800">
        Google Haritalar yüklenemedi. API anahtarı, faturalandırma ve Maps JavaScript API etkinliğini kontrol edin.
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
        options={{ fullscreenControl: false, mapTypeControl: false }}
      >
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
      </GoogleMap>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-xs text-stone-700 shadow-md backdrop-blur dark:bg-zinc-900/90 dark:text-stone-300">
        {googlePlaces.length
          ? `${googlePlaces.length} canlı mekan (Google Places). Pin’e dokunun → detay ve rota.`
          : 'Bu bölgede sonuç yok; yarıçapı artırmayı deneyin veya kategori değiştirin.'}
        {onRequestRoute && routingPlaceId ? ' · Rota hesaplanıyor…' : ''}
      </div>
    </div>
  );
}

export { decodePolyline };
