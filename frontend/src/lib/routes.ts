/** Uygulama içi sayfa yolları — router ile tek kaynak. */

export const APP_ROUTES = {
  discover: '/discover',
  cities: '/cities',
  city: (cityId: number) => `/cities/${cityId}`,
  cityPlaces: (cityId: number, category?: string) =>
    category ? `/cities/${cityId}/places?category=${encodeURIComponent(category)}` : `/cities/${cityId}/places`,
  district: (cityId: number, districtId: number) => `/cities/${cityId}/districts/${districtId}`,
  districtPlaces: (cityId: number, districtId: number, category?: string) =>
    category
      ? `/cities/${cityId}/districts/${districtId}?category=${encodeURIComponent(category)}`
      : `/cities/${cityId}/districts/${districtId}`,
  googlePlace: (placeId: string) => `/google-places/${encodeURIComponent(placeId)}`,
  dbPlace: (placeId: number) => `/places/${placeId}`,
  map: '/map',
  assistant: '/assistant',
} as const;

export function googlePlaceDetailPath(
  placeId: string,
  params?: { back?: string; cityId?: number },
): string {
  const q = new URLSearchParams();
  if (params?.back) q.set('back', params.back);
  if (params?.cityId) q.set('cityId', String(params.cityId));
  const qs = q.toString();
  return qs ? `${APP_ROUTES.googlePlace(placeId)}?${qs}` : APP_ROUTES.googlePlace(placeId);
}
