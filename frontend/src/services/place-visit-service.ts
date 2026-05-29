import { requestJson } from '../lib/api';
import type { AlsoVisitedResponse, PlaceVisitPayload } from '../types/place-visit';

export async function recordPlaceVisit(
  accessToken: string,
  payload: PlaceVisitPayload,
): Promise<void> {
  await requestJson<void>('/places/visits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
}

export async function fetchPlaceAlsoVisited(
  placeId: number,
  params?: { city?: string; limit?: number },
): Promise<AlsoVisitedResponse> {
  const q = new URLSearchParams();
  if (params?.city) q.set('city', params.city);
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return requestJson<AlsoVisitedResponse>(
    `/places/${placeId}/also-visited${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchGooglePlaceAlsoVisited(
  googlePlaceId: string,
  params?: { city?: string; place_name?: string; limit?: number },
): Promise<AlsoVisitedResponse> {
  const q = new URLSearchParams();
  if (params?.city) q.set('city', params.city);
  if (params?.place_name) q.set('place_name', params.place_name);
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return requestJson<AlsoVisitedResponse>(
    `/places/google/${encodeURIComponent(googlePlaceId)}/also-visited${qs ? `?${qs}` : ''}`,
  );
}
