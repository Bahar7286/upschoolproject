import { requestJson } from '../lib/api';
import type { PlaceCategoryCount, PlaceNearbyResponse, PlaceResponse } from '../types/place';
import type { PlaceCategory } from '../types/place';

export async function listPlaces(params?: {
  city?: string;
  district?: string;
  category?: PlaceCategory;
  q?: string;
  limit?: number;
}): Promise<PlaceResponse[]> {
  const search = new URLSearchParams();
  if (params?.city) search.set('city', params.city);
  if (params?.district) search.set('district', params.district);
  if (params?.category) search.set('category', params.category);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return requestJson<PlaceResponse[]>(`/places${qs ? `?${qs}` : ''}`);
}

export async function listPlaceCategories(city = 'Istanbul'): Promise<PlaceCategoryCount[]> {
  return requestJson<PlaceCategoryCount[]>(`/places/categories?city=${encodeURIComponent(city)}`);
}

export async function listNearbyPlaces(params: {
  lat: number;
  lng: number;
  radius_m?: number;
  category?: PlaceCategory;
  city?: string;
}): Promise<PlaceNearbyResponse[]> {
  const search = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
  });
  if (params.radius_m) search.set('radius_m', String(params.radius_m));
  if (params.category) search.set('category', params.category);
  if (params.city) search.set('city', params.city);
  return requestJson<PlaceNearbyResponse[]>(`/places/nearby?${search.toString()}`);
}

export async function getPlace(placeId: number): Promise<PlaceResponse> {
  return requestJson<PlaceResponse>(`/places/${placeId}`);
}
