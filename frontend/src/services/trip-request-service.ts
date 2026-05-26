import { requestJsonWithAuth } from '../lib/api';

export interface PlannedStop {
  place_id: number;
  name: string;
  order: number;
}

export interface GuideOffer {
  offer_id: number;
  request_id: number;
  guide_id: number;
  guide_name: string;
  is_verified_guide: boolean;
  message: string;
  base_total: number;
  discount_rate: number;
  discount_label: string;
  offered_total: number;
  offered_per_person: number;
  platform_fee: number;
  guide_net_estimate: number;
  status: string;
  created_at: string;
}

export interface TripRequest {
  request_id: number;
  tourist_id: number;
  tourist_name: string;
  route_id: number | null;
  route_title: string | null;
  route_mode: string;
  planned_stops: PlannedStop[];
  title: string;
  city: string;
  interests: string[];
  group_size: number;
  preferred_date: string;
  duration_minutes: number;
  budget: number;
  preferred_language: string;
  message: string;
  status: string;
  offer_count: number;
  offers: GuideOffer[];
  created_at: string;
}

export interface TripRequestCreatePayload {
  title: string;
  city?: string;
  interests?: string[];
  route_id?: number | null;
  route_mode?: 'existing' | 'custom';
  planned_stops?: PlannedStop[];
  group_size: number;
  preferred_date: string;
  duration_minutes?: number;
  budget?: number;
  preferred_language?: string;
  message: string;
}

export interface GuideOfferCreatePayload {
  message: string;
  base_total: number;
}

export async function createTripRequest(
  accessToken: string,
  payload: TripRequestCreatePayload,
): Promise<TripRequest> {
  return requestJsonWithAuth('/trip-requests', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMyTripRequests(accessToken: string): Promise<TripRequest[]> {
  return requestJsonWithAuth('/trip-requests/mine', accessToken);
}

export async function listOpenTripRequests(accessToken: string, city = 'Istanbul'): Promise<TripRequest[]> {
  return requestJsonWithAuth(`/trip-requests/open?city=${encodeURIComponent(city)}`, accessToken);
}

export async function getTripRequest(accessToken: string, requestId: number): Promise<TripRequest> {
  return requestJsonWithAuth(`/trip-requests/${requestId}`, accessToken);
}

export async function submitGuideOffer(
  accessToken: string,
  requestId: number,
  payload: GuideOfferCreatePayload,
): Promise<GuideOffer> {
  return requestJsonWithAuth(`/trip-requests/${requestId}/offers`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function acceptGuideOffer(
  accessToken: string,
  requestId: number,
  offerId: number,
): Promise<TripRequest> {
  return requestJsonWithAuth(`/trip-requests/${requestId}/offers/${offerId}/accept`, accessToken, {
    method: 'POST',
  });
}
