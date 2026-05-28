import type { ReactElement } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

import { decodePolyline } from '../../utils/polyline';
import { LeafletRegionMap } from './leaflet-region-map';

export function RoutePreviewMap({
  dest,
  encodedPolyline,
  origin,
}: {
  dest: { lat: number; lng: number; title?: string };
  encodedPolyline: string;
  origin?: { lat: number; lng: number } | null;
}): ReactElement {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const path = decodePolyline(encodedPolyline);
  const center = origin ?? dest;

  if (googleKey) {
    return (
      <GoogleRoutePreview apiKey={googleKey} center={center} dest={dest} origin={origin} path={path} />
    );
  }

  const places = [{ place_id: 'dest', name: dest.title ?? 'Hedef', lat: dest.lat, lng: dest.lng, address: '', types: [], google_maps_uri: '' }];
  return <LeafletRegionMap center={center} zoom={14} places={places} />;
}

function GoogleRoutePreview({
  apiKey,
  center,
  dest,
  origin,
  path,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  dest: { lat: number; lng: number; title?: string };
  origin?: { lat: number; lng: number } | null;
  path: { lat: number; lng: number }[];
}): ReactElement {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'historial-google-maps-script',
    googleMapsApiKey: apiKey,
    version: 'weekly',
  });

  if (loadError) {
    return <p className="text-sm text-red-700">Harita yüklenemedi.</p>;
  }
  if (!isLoaded) {
    return <div className="h-56 animate-pulse rounded-2xl bg-stone-200" aria-busy="true" />;
  }

  return (
    <div className="h-56 w-full overflow-hidden rounded-2xl border border-stone-900/10">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={14}
        options={{ mapTypeControl: false, fullscreenControl: false }}
      >
        {origin ? (
          <Marker
            position={origin}
            title="Başlangıç"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
        ) : null}
        <Marker position={dest} title={dest.title ?? 'Hedef'} />
        {path.length > 1 ? (
          <Polyline path={path} options={{ strokeColor: '#b45309', strokeWeight: 5, strokeOpacity: 0.9 }} />
        ) : null}
      </GoogleMap>
    </div>
  );
}
