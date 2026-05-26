import { requestJson, requestJsonWithAuth } from '../lib/api';
import type { NoteResponse, ReviewCreatePayload, ReviewResponse, ReviewSummary } from '../types/social';

export async function listMyNotes(accessToken: string): Promise<NoteResponse[]> {
  return requestJsonWithAuth<NoteResponse[]>('/notes/me', accessToken);
}

export async function getMyRouteNote(routeId: number, accessToken: string): Promise<NoteResponse | null> {
  return requestJsonWithAuth<NoteResponse | null>(`/routes/${routeId}/notes/me`, accessToken);
}

export async function saveMyRouteNote(
  routeId: number,
  content: string,
  accessToken: string,
): Promise<NoteResponse> {
  return requestJsonWithAuth<NoteResponse>(`/routes/${routeId}/notes/me`, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function deleteMyRouteNote(routeId: number, accessToken: string): Promise<void> {
  await requestJsonWithAuth(`/routes/${routeId}/notes/me`, accessToken, { method: 'DELETE' });
}

export async function listRouteReviews(routeId: number): Promise<ReviewResponse[]> {
  return requestJson<ReviewResponse[]>(`/routes/${routeId}/reviews`);
}

export async function getRouteReviewSummary(routeId: number): Promise<ReviewSummary> {
  return requestJson<ReviewSummary>(`/routes/${routeId}/reviews/summary`);
}

export async function createRouteReview(
  routeId: number,
  payload: ReviewCreatePayload,
  accessToken: string,
): Promise<ReviewResponse> {
  return requestJsonWithAuth<ReviewResponse>(`/routes/${routeId}/reviews`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteRouteReview(
  routeId: number,
  reviewId: number,
  accessToken: string,
): Promise<void> {
  await requestJsonWithAuth(`/routes/${routeId}/reviews/${reviewId}`, accessToken, { method: 'DELETE' });
}
