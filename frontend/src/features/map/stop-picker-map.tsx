import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { ensureLeafletDefaultIcons } from './leaflet-default-icons';
import { OSM_ATTRIBUTION, OSM_TILE_URL } from './map-config';

ensureLeafletDefaultIcons();

export interface StopPickerPoint {
  localId: string;
  title: string;
  latitude: number;
  longitude: number;
}

function FlyToCenter({
  center,
  cityKey,
  zoom = 12,
}: {
  center: { lat: number; lng: number };
  cityKey: string;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.85 });
  }, [center.lat, center.lng, cityKey, zoom, map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function StopPickerMap({
  center,
  cityKey,
  stops,
  activeLocalId,
  onPick,
}: {
  center: { lat: number; lng: number };
  cityKey: string;
  stops: StopPickerPoint[];
  activeLocalId: string | null;
  onPick: (lat: number, lng: number) => void;
}): ReactElement {
  const validStops = stops.filter(
    (s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude) && s.title.trim(),
  );

  return (
    <div className="h-[min(36vh,280px)] w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-sm dark:border-white/10">
      <MapContainer center={[center.lat, center.lng]} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <FlyToCenter center={center} cityKey={cityKey} />
        <MapClickHandler onPick={onPick} />
        {validStops.map((stop) => (
          <CircleMarker
            key={stop.localId}
            center={[stop.latitude, stop.longitude]}
            radius={activeLocalId === stop.localId ? 11 : 8}
            pathOptions={{
              color: activeLocalId === stop.localId ? '#15803d' : '#b45309',
              fillColor: activeLocalId === stop.localId ? '#22c55e' : '#d97706',
              fillOpacity: 0.9,
              weight: activeLocalId === stop.localId ? 3 : 2,
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
