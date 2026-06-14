import { filterGoogleByCity, filterGoogleByDistrict } from '../utils/district-filter';
import type { GooglePlaceSummary } from '../types/google';
import type { PlaceCategory } from '../types/place';
import { fetchGooglePlacesNearby, fetchGooglePlacesSearch } from './google-service';

const CATEGORY_QUERY: Record<PlaceCategory, string> = {
  museum: 'turistik yer müze',
  historical: 'tarihi yer',
  palace: 'saray müze',
  mosque: 'cami turistik',
  bazaar: 'çarşı turistik',
  street: 'turistik nokta',
  restaurant: 'restoran',
  accommodation: 'otel konaklama',
};

function dedupePlaces(items: GooglePlaceSummary[]): GooglePlaceSummary[] {
  const seen = new Set<string>();
  const out: GooglePlaceSummary[] = [];
  for (const p of items) {
    if (!p.place_id || seen.has(p.place_id)) continue;
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || p.lat === 0 || p.lng === 0) continue;
    seen.add(p.place_id);
    out.push(p);
  }
  return out;
}

function applyRegionFilter(
  items: GooglePlaceSummary[],
  cityName: string,
  districtName?: string,
): GooglePlaceSummary[] {
  let list = items;
  if (districtName?.trim()) {
    const byDistrict = filterGoogleByDistrict(list, districtName);
    list = byDistrict.length > 0 ? byDistrict : filterGoogleByCity(list, cityName);
  } else if (cityName.trim()) {
    const byCity = filterGoogleByCity(list, cityName);
    list = byCity.length > 0 ? byCity : list;
  }
  return dedupePlaces(list);
}

/** İl/ilçe için Google Places — yakın arama + metin araması yedekleri. */
export async function fetchRegionGooglePlaces(params: {
  lat: number;
  lng: number;
  cityName: string;
  districtName?: string;
  category: PlaceCategory;
}): Promise<GooglePlaceSummary[]> {
  const { lat, lng, cityName, districtName, category } = params;
  const radii = districtName ? [6000, 12000, 25000] : [12000, 25000, 40000];

  for (const radius_m of radii) {
    try {
      const res = await fetchGooglePlacesNearby({ lat, lng, radius_m, category });
      const filtered = applyRegionFilter(res.places, cityName, districtName);
      if (filtered.length >= 2) return filtered;
    } catch {
      /* sonraki yarıçap */
    }
  }

  const where = districtName ? `${districtName} ${cityName}` : cityName;
  const baseQuery = CATEGORY_QUERY[category] ?? 'turistik yer';
  const queries = [`${baseQuery} ${where}`, `turistik ${where}`, where];

  for (const q of queries) {
    try {
      const res = await fetchGooglePlacesSearch({ q, lat, lng, radius_m: 50000 });
      const filtered = applyRegionFilter(res.places, cityName, districtName);
      if (filtered.length > 0) return filtered;
    } catch {
      /* sonraki sorgu */
    }
  }

  return [];
}
