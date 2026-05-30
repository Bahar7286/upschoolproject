import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

import { decodePolyline } from '../../utils/polyline';
import { LeafletPickRouteMap } from './leaflet-pick-route-map';

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
  const center = origin ?? dest;
  const canPick = pickOrigin || pickWaypoint;

  if (canPick || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <LeafletPickRouteMap
        center={center}
        dest={dest}
        origin={origin}
        waypoints={waypoints}
        encodedPolyline={encodedPolyline}
        pickOrigin={pickOrigin}
        pickWaypoint={pickWaypoint}
        onPickOrigin={onPickOrigin}
        onPickWaypoint={onPickWaypoint}
        heightClass="h-[min(48vh,360px)] min-h-[260px]"
      />
    );
  }

  return (
    <GoogleRoutePreview
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
      center={center}
      dest={dest}
      origin={origin}
      path={encodedPolyline ? decodePolyline(encodedPolyline) : []}
      waypoints={waypoints}
    />
  );
}

function GoogleRoutePreview({
  apiKey,
  center,
  dest,
  origin,
  path,
  waypoints,
}: {
  apiKey: string;
  center: { lat: number; lng: number };
  dest: { lat: number; lng: number; title?: string };
  origin?: { lat: number; lng: number } | null;
  path: { lat: number; lng: number }[];
  waypoints?: { lat: number; lng: number }[];
}): ReactElement {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'historial-google-maps-script',
    googleMapsApiKey: apiKey,
    version: 'weekly',
  });
  const [useOsm, setUseOsm] = useState(false);

  useEffect(() => {
    if (loadError) setUseOsm(true);
  }, [loadError]);

  if (useOsm || loadError) {
    return (
      <LeafletPickRouteMap
        center={center}
        dest={dest}
        origin={origin}
        waypoints={waypoints}
        encodedPolyline=""
        heightClass="h-[min(48vh,360px)] min-h-[260px]"
      />
    );
  }

  if (!isLoaded) {
    return <div className="h-[min(260px,48vh)] min-h-[260px] animate-pulse rounded-2xl bg-stone-200" aria-busy="true" />;
  }

  return (
    <div className="h-[min(48vh,360px)] min-h-[260px] w-full overflow-hidden rounded-2xl border border-stone-900/10">
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
        {waypoints?.map((wp, i) => (
          <Marker
            key={`wp-${i}-${wp.lat}-${wp.lng}`}
            position={wp}
            label={{ text: String(i + 1), color: '#fff', fontSize: '11px', fontWeight: '700' }}
            title={`Ara durak ${i + 1}`}
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
