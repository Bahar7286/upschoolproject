import { requestJsonWithAuth } from '../lib/api';
import type { PlanCreatePayload, PlanResponse, PlanUpdatePayload } from '../types/plan';

export async function listPlans(accessToken: string, month?: string): Promise<PlanResponse[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return requestJsonWithAuth<PlanResponse[]>(`/plans${query}`, accessToken);
}

export async function createPlan(accessToken: string, payload: PlanCreatePayload): Promise<PlanResponse> {
  return requestJsonWithAuth<PlanResponse>('/plans', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePlan(
  accessToken: string,
  planId: number,
  payload: PlanUpdatePayload,
): Promise<PlanResponse> {
  return requestJsonWithAuth<PlanResponse>(`/plans/${planId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePlan(accessToken: string, planId: number): Promise<void> {
  await requestJsonWithAuth(`/plans/${planId}`, accessToken, { method: 'DELETE' });
}
