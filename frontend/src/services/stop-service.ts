import { requestJson, requestJsonWithAuth } from '../lib/api';
import type {
  StopCreatePayload,
  StopResponse,
  StopUpdatePayload,
} from '../types/stop';

export async function listStops(
  routeId: number,
  accessToken?: string | null,
): Promise<StopResponse[]> {
  if (accessToken) {
    return requestJsonWithAuth<StopResponse[]>(`/routes/${routeId}/stops`, accessToken, {
      method: 'GET',
    });
  }
  return requestJson<StopResponse[]>(`/routes/${routeId}/stops`, { method: 'GET' });
}

export async function getStop(
  routeId: number,
  stopId: number,
): Promise<StopResponse> {
  return requestJson<StopResponse>(`/routes/${routeId}/stops/${stopId}`, {
    method: 'GET',
  });
}

export async function createStop(
  routeId: number,
  payload: StopCreatePayload,
): Promise<StopResponse> {
  return requestJson<StopResponse>(`/routes/${routeId}/stops`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStop(
  routeId: number,
  stopId: number,
  payload: StopUpdatePayload,
): Promise<StopResponse> {
  return requestJson<StopResponse>(`/routes/${routeId}/stops/${stopId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteStop(
  routeId: number,
  stopId: number,
): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/routes/${routeId}/stops/${stopId}`, {
    method: 'DELETE',
  });
}
