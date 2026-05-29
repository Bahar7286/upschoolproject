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

function FitStopsBounds({ stops }: { stops: StopPickerPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = stops.filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].latitude, valid[0].longitude], 14);
      return;
    }
    const lats = valid.map((s) => s.latitude);
    const lngs = valid.map((s) => s.longitude);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [32, 32], maxZoom: 15 },
    );
  }, [stops, map]);
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
  stops,
  activeLocalId,
  onPick,
}: {
  center: { lat: number; lng: number };
  stops: StopPickerPoint[];
  activeLocalId: string | null;
  onPick: (lat: number, lng: number) => void;
}): ReactElement {
  const validStops = stops.filter(
    (s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude) && s.title.trim(),
  );

  return (
    <div className="h-[min(36vh,280px)] w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-sm dark:border-white/10">
      <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full" scrollWheelZoom>
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <FitStopsBounds stops={validStops} />
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
