import { requestJson } from '../lib/api';
import type {
  RouteCreatePayload,
  RouteRecommendPayload,
  RouteResponse,
  RouteUpdatePayload,
} from '../types/route';

export async function listRoutes(): Promise<RouteResponse[]> {
  return requestJson<RouteResponse[]>('/routes', { method: 'GET' });
}

export async function getRoute(routeId: number): Promise<RouteResponse> {
  return requestJson<RouteResponse>(`/routes/${routeId}`, { method: 'GET' });
}

export async function createRoute(payload: RouteCreatePayload): Promise<RouteResponse> {
  return requestJson<RouteResponse>('/routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRoute(
  routeId: number,
  payload: RouteUpdatePayload,
): Promise<RouteResponse> {
  return requestJson<RouteResponse>(`/routes/${routeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteRoute(routeId: number): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/routes/${routeId}`, {
    method: 'DELETE',
  });
}

export async function recommendRoutes(
  payload: RouteRecommendPayload,
): Promise<RouteResponse[]> {
  return requestJson<RouteResponse[]>('/routes/recommend', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
