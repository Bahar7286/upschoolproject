import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import type { RouteResponse } from '../../types/route';
import { ensureLeafletDefaultIcons } from './leaflet-default-icons';
import { routeMapPosition } from './route-map-position';

const CENTER: [number, number] = [41.015137, 28.97953];

export function LeafletExploreMap({ routes }: { routes: RouteResponse[] }): ReactElement {
  useEffect(() => {
    ensureLeafletDefaultIcons();
  }, []);

  return (
    <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-lift">
      <MapContainer center={CENTER} zoom={12} className="z-0 h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routes.map((route) => {
          const { lat, lng } = routeMapPosition(route.route_id);
          return (
            <Marker key={route.route_id} position={[lat, lng]}>
              <Popup>
                <div className="min-w-[170px] space-y-2 p-1 font-sans text-sm text-stone-900">
                  <div className="font-bold leading-snug">{route.title}</div>
                  <div className="text-xs text-stone-600">{route.city}</div>
                  <Link className="font-semibold text-primary underline" to={`/routes/${route.route_id}`}>
                    Rotayı aç
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
