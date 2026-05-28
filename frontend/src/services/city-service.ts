import { requestJson } from '../lib/api';

import type { CityResponse, DistrictResponse } from '../types/city';

interface TrDistrictRow {
  id: number;
  provinceId: number;
  name: string;
  slug: string;
}

let trDistrictsCache: TrDistrictRow[] | null = null;

async function loadDistrictsFallback(cityId: number): Promise<DistrictResponse[]> {
  if (!trDistrictsCache) {
    const res = await fetch('/data/tr-districts.json');
    if (!res.ok) return [];
    trDistrictsCache = (await res.json()) as TrDistrictRow[];
  }
  return trDistrictsCache
    .filter((d) => d.provinceId === cityId)
    .map((d) => ({
      district_id: d.id,
      city_id: d.provinceId,
      name_tr: d.name,
      slug: d.slug,
      center_lat: 0,
      center_lng: 0,
      image_url: null,
    }));
}

export async function listCities(): Promise<CityResponse[]> {
  return requestJson<CityResponse[]>('/cities');
}

export async function listDistrictsByCity(cityId: number): Promise<DistrictResponse[]> {
  try {
    const rows = await requestJson<DistrictResponse[]>(`/cities/${cityId}/districts`);
    if (rows.length > 0) return rows;
  } catch {
    /* API erişilemez — yerel JSON yedek */
  }
  return loadDistrictsFallback(cityId);
}
