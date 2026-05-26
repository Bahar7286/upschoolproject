import L from 'leaflet';

import type { PlaceCategory } from '../../types/place';
import { PLACE_CATEGORY_COLORS } from '../../types/place';

export function placeCategoryIcon(category: PlaceCategory, isPartner = false): L.DivIcon {
  const color = PLACE_CATEGORY_COLORS[category] ?? '#64748b';
  const ring = isPartner ? 'box-shadow:0 0 0 2px #c9a227;' : '';
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;${ring}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

/** Türkiye odaklı varsayılan harita merkezi — İstanbul Tarihi Yarımada */
export const TURKEY_MAP_CENTER: [number, number] = [41.015137, 28.97953];

/** OSM standart katman — Türkiye WGS84 uyumlu */
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
