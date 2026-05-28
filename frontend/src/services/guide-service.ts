import { requestJson, requestJsonWithAuth } from '../lib/api';
import type { RouteCreatePayload, RouteResponse, RouteUpdatePayload } from '../types/route';

export interface Guide {
  guide_id: number;
  full_name: string;
  email: string;
  role: string;
  route_count: number;
  xp: number;
  badges: string[];
}

export interface GuideListResponse {
  items: Guide[];
  total: number;
}

export interface GuideCreatePayload {
  full_name: string;
  email: string;
  password: string;
}

export interface GuideUpdatePayload {
  full_name?: string;
  email?: string;
  password?: string;
}

export interface GuideRouteListResponse {
  guide_id: number;
  items: RouteResponse[];
  total: number;
}

export interface GuideRouteCreatePayload {
  title: string;
  city: string;
  estimated_minutes: number;
  price: number;
  tags: string[];
}

export interface GuideEarningsResponse {
  guide_id: number;
  monthly_earnings: number;
  route_sales: number;
}

export interface GuideRouteStat {
  route_id: number;
  title: string;
  sales_count: number;
  gross_revenue: number;
  guide_net: number;
}

export interface GuideAnalyticsResponse {
  guide_id: number;
  route_count: number;
  route_sales: number;
  gross_revenue: number;
  guide_net: number;
  pending_offers: number;
  accepted_offers: number;
  top_routes: GuideRouteStat[];
}

export interface GuidePayoutPayload {
  guide_id: number;
  amount: number;
}

export async function listGuides(): Promise<GuideListResponse> {
  return requestJson<GuideListResponse>('/guides', { method: 'GET' });
}

export async function createGuide(payload: GuideCreatePayload): Promise<Guide> {
  return requestJson<Guide>('/guides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getGuide(guideId: number): Promise<Guide> {
  return requestJson<Guide>(`/guides/${guideId}`, { method: 'GET' });
}

export async function updateGuide(guideId: number, payload: GuideUpdatePayload): Promise<Guide> {
  return requestJson<Guide>(`/guides/${guideId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteGuide(guideId: number): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/guides/${guideId}`, { method: 'DELETE' });
}

export async function listGuideRoutes(guideId: number): Promise<GuideRouteListResponse> {
  return requestJson<GuideRouteListResponse>(`/guides/${guideId}/routes`, { method: 'GET' });
}

export async function createGuideRoute(
  guideId: number,
  payload: GuideRouteCreatePayload,
): Promise<RouteResponse> {
  return requestJson<RouteResponse>(`/guides/${guideId}/routes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getGuideRoute(guideId: number, routeId: number): Promise<RouteResponse> {
  return requestJson<RouteResponse>(`/guides/${guideId}/routes/${routeId}`, { method: 'GET' });
}

export async function updateGuideRoute(
  guideId: number,
  routeId: number,
  payload: RouteUpdatePayload,
): Promise<RouteResponse> {
  return requestJson<RouteResponse>(`/guides/${guideId}/routes/${routeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteGuideRoute(guideId: number, routeId: number): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/guides/${guideId}/routes/${routeId}`, {
    method: 'DELETE',
  });
}

export async function submitGuideRouteReview(
  accessToken: string,
  guideId: number,
  routeId: number,
): Promise<RouteResponse> {
  return requestJsonWithAuth(`/guides/${guideId}/routes/${routeId}/submit-review`, accessToken, {
    method: 'POST',
  });
}

export async function publishGuideRoute(
  accessToken: string,
  guideId: number,
  routeId: number,
): Promise<RouteResponse> {
  return requestJsonWithAuth(`/guides/${guideId}/routes/${routeId}/publish`, accessToken, {
    method: 'POST',
  });
}

export async function getGuideEarnings(guideId: number): Promise<GuideEarningsResponse> {
  return requestJson<GuideEarningsResponse>(`/guides/${guideId}/earnings`, {
    method: 'GET',
  });
}

export async function fetchMyGuideEarnings(accessToken: string): Promise<GuideEarningsResponse> {
  return requestJsonWithAuth<GuideEarningsResponse>('/guides/me/earnings', accessToken, {
    method: 'GET',
  });
}

export async function fetchMyGuideAnalytics(accessToken: string): Promise<GuideAnalyticsResponse> {
  return requestJsonWithAuth<GuideAnalyticsResponse>('/guides/me/analytics', accessToken, {
    method: 'GET',
  });
}

export async function requestGuidePayout(payload: GuidePayoutPayload): Promise<{ status: string; message: string }> {
  return requestJson<{ status: string; message: string }>('/guides/payout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
