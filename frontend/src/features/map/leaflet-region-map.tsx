import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';

import type { GooglePlaceSummary } from '../../types/google';
import { ensureLeafletDefaultIcons } from './leaflet-default-icons';
import { OSM_ATTRIBUTION, OSM_TILE_URL } from './map-config';

ensureLeafletDefaultIcons();

function FlyToRegion({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [lat, lng, zoom, map]);
  return null;
}

export function LeafletRegionMap({
  center,
  zoom,
  places,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  places: GooglePlaceSummary[];
}): ReactElement {
  const navigate = useNavigate();

  return (
    <div className="h-[min(42vh,360px)] w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-lift">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <FlyToRegion lat={center.lat} lng={center.lng} zoom={zoom} />
        {places.map((p) => (
          <CircleMarker
            key={p.place_id}
            center={[p.lat, p.lng]}
            radius={8}
            pathOptions={{ color: '#b45309', fillColor: '#d97706', fillOpacity: 0.85 }}
            eventHandlers={{
              click: () => navigate(`/google-places/${encodeURIComponent(p.place_id)}`),
            }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              <Link className="text-xs font-bold text-primary" to={`/google-places/${encodeURIComponent(p.place_id)}`}>
                Detay
              </Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
