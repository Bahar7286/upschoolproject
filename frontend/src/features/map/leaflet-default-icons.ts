import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

let applied = false;

/** Vite ile Leaflet varsayılan marker ikonlarının kırılmasını önler. */
export function ensureLeafletDefaultIcons(): void {
  if (applied) {
    return;
  }
  const icon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = icon;
  applied = true;
}
