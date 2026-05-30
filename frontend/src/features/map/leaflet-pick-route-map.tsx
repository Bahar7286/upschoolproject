import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet';

import { decodePolyline } from '../../utils/polyline';
import { ensureLeafletDefaultIcons } from './leaflet-default-icons';
import { OSM_ATTRIBUTION, OSM_TILE_URL } from './map-config';

function MapPickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LeafletPickRouteMap({
  center,
  dest,
  origin,
  waypoints = [],
  encodedPolyline = '',
  pickOrigin = false,
  pickWaypoint = false,
  onPickOrigin,
  onPickWaypoint,
  heightClass = 'h-[min(48vh,360px)] min-h-[260px]',
}: {
  center: { lat: number; lng: number };
  dest: { lat: number; lng: number; title?: string };
  origin?: { lat: number; lng: number } | null;
  waypoints?: { lat: number; lng: number }[];
  encodedPolyline?: string;
  pickOrigin?: boolean;
  pickWaypoint?: boolean;
  onPickOrigin?: (lat: number, lng: number) => void;
  onPickWaypoint?: (lat: number, lng: number) => void;
  heightClass?: string;
}): ReactElement {
  useEffect(() => {
    ensureLeafletDefaultIcons();
  }, []);

  const canPick = pickOrigin || pickWaypoint;
  let path: [number, number][] = [];
  if (encodedPolyline) {
    try {
      path = decodePolyline(encodedPolyline).map((p) => [p.lat, p.lng] as [number, number]);
    } catch {
      path = [];
    }
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-lift ${heightClass}`}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        className="z-0 h-full w-full"
        scrollWheelZoom
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <MapPickHandler
          enabled={canPick}
          onPick={(lat, lng) => {
            if (pickWaypoint && onPickWaypoint) {
              onPickWaypoint(lat, lng);
              return;
            }
            if (pickOrigin && onPickOrigin) {
              onPickOrigin(lat, lng);
            }
          }}
        />
        {origin ? (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={9}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9, weight: 2 }}
          />
        ) : null}
        {waypoints.map((wp, i) => (
          <CircleMarker
            key={`wp-${i}-${wp.lat}`}
            center={[wp.lat, wp.lng]}
            radius={8}
            pathOptions={{ color: '#b45309', fillColor: '#d97706', fillOpacity: 0.95, weight: 2 }}
          />
        ))}
        <Marker position={[dest.lat, dest.lng]} title={dest.title ?? 'Hedef'} />
        {path.length > 1 ? (
          <Polyline positions={path} pathOptions={{ color: '#b45309', weight: 5, opacity: 0.9 }} />
        ) : null}
      </MapContainer>
      {canPick ? (
        <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-white/95 px-2 py-1.5 text-center text-xs font-semibold text-amber-900 shadow dark:bg-zinc-900/95 dark:text-amber-100">
          {pickWaypoint ? 'Ara durak için haritaya dokunun' : 'Başlangıç için haritaya dokunun'}
        </p>
      ) : null}
    </div>
  );
}
