import { requestJson } from '../lib/api';
import type {
  ComputeRouteResponse,
  GeoCenterResponse,
  GooglePlaceDetail,
  GooglePlacesNearbyResponse,
} from '../types/google';

export async function fetchGeoCenter(params: {
  cityId?: number;
  districtId?: number;
}): Promise<GeoCenterResponse> {
  const q = new URLSearchParams();
  if (params.districtId) q.set('district_id', String(params.districtId));
  else if (params.cityId) q.set('city_id', String(params.cityId));
  return requestJson<GeoCenterResponse>(`/geo/center?${q.toString()}`);
}

export async function fetchGooglePlacesNearby(params: {
  lat: number;
  lng: number;
  radius_m?: number;
  category?: string | null;
}): Promise<GooglePlacesNearbyResponse> {
  const q = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius_m: String(params.radius_m ?? 5000),
  });
  if (params.category) q.set('category', params.category);
  return requestJson<GooglePlacesNearbyResponse>(`/google/places/nearby?${q.toString()}`);
}

export async function fetchGooglePlaceDetail(placeId: string): Promise<GooglePlaceDetail> {
  return requestJson<GooglePlaceDetail>(`/google/places/${encodeURIComponent(placeId)}`);
}

export async function computeGoogleRoute(body: {
  origin_lat: number;
  origin_lng: number;
  dest_lat: number;
  dest_lng: number;
  travel_mode?: string;
  waypoints?: { lat: number; lng: number }[];
}): Promise<ComputeRouteResponse> {
  return requestJson<ComputeRouteResponse>('/google/routes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
