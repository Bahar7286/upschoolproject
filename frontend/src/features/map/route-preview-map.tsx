import type { ReactElement } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

import { decodePolyline } from '../../utils/polyline';
import { LeafletRegionMap } from './leaflet-region-map';

export function RoutePreviewMap({
  dest,
  encodedPolyline,
  origin,
  pickOrigin = false,
  pickWaypoint = false,
  onPickOrigin,
  onPickWaypoint,
  waypoints = [],
}: {
  dest: { lat: number; lng: number; title?: string };
  encodedPolyline: string;
  origin?: { lat: number; lng: number } | null;
  pickOrigin?: boolean;
  pickWaypoint?: boolean;
  onPickOrigin?: (lat: number, lng: number) => void;
  onPickWaypoint?: (lat: number, lng: number) => void;
  waypoints?: { lat: number; lng: number }[];
}): ReactElement {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const path = encodedPolyline ? decodePolyline(encodedPolyline) : [];
  const center = origin ?? dest;

  if (googleKey) {
    return (
      <GoogleRoutePreview
        apiKey={googleKey}
        center={center}
        dest={dest}
        origin={origin}
        path={path}
        pickOrigin={pickOrigin}
        pickWaypoint={pickWaypoint}
        onPickOrigin={onPickOrigin}
        onPickWaypoint={onPickWaypoint}
        waypoints={waypoints}
      />
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
  pickOrigin,
  pickWaypoint,
  onPickOrigin,
  onPickWaypoint,
  waypoints,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  dest: { lat: number; lng: number; title?: string };
  origin?: { lat: number; lng: number } | null;
  path: { lat: number; lng: number }[];
  pickOrigin?: boolean;
  pickWaypoint?: boolean;
  onPickOrigin?: (lat: number, lng: number) => void;
  onPickWaypoint?: (lat: number, lng: number) => void;
  waypoints?: { lat: number; lng: number }[];
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

  const canPick = pickOrigin || pickWaypoint;

  return (
    <div className="h-56 w-full overflow-hidden rounded-2xl border border-stone-900/10">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={14}
        options={{ mapTypeControl: false, fullscreenControl: false }}
        onClick={
          canPick
            ? (e) => {
                if (!e.latLng) return;
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                if (pickWaypoint && onPickWaypoint) {
                  onPickWaypoint(lat, lng);
                  return;
                }
                if (pickOrigin && onPickOrigin) {
                  onPickOrigin(lat, lng);
                }
              }
            : undefined
        }
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
        {waypoints?.map((wp, i) => (
          <Marker
            key={`wp-${i}-${wp.lat}-${wp.lng}`}
            position={wp}
            label={{ text: String(i + 1), color: '#fff', fontSize: '11px', fontWeight: '700' }}
            title={`Ara durak ${i + 1}`}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#b45309',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
        ))}
        <Marker position={dest} title={dest.title ?? 'Hedef'} />
        {path.length > 1 ? (
          <Polyline path={path} options={{ strokeColor: '#b45309', strokeWeight: 5, strokeOpacity: 0.9 }} />
        ) : null}
      </GoogleMap>
    </div>
  );
}
