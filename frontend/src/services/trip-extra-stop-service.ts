import { requestJsonWithAuth } from '../lib/api';
import type { TripExtraStop, TripExtraStopCreatePayload } from '../types/trip-extra-stop';

export async function listTripExtraStops(
  routeId: number,
  accessToken: string,
): Promise<TripExtraStop[]> {
  return requestJsonWithAuth<TripExtraStop[]>(
    `/routes/${routeId}/my-extra-stops`,
    accessToken,
    { method: 'GET' },
  );
}

export async function addTripExtraStop(
  routeId: number,
  accessToken: string,
  payload: TripExtraStopCreatePayload,
): Promise<TripExtraStop> {
  return requestJsonWithAuth<TripExtraStop>(
    `/routes/${routeId}/my-extra-stops`,
    accessToken,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

export async function removeTripExtraStop(
  routeId: number,
  extraStopId: number,
  accessToken: string,
): Promise<void> {
  await requestJsonWithAuth<{ status: string }>(
    `/routes/${routeId}/my-extra-stops/${extraStopId}`,
    accessToken,
    { method: 'DELETE' },
  );
}
