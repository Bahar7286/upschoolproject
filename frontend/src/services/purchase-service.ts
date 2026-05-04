import { requestJson } from '../lib/api';
import type {
  PurchaseCreatePayload,
  PurchaseResponse,
  PurchaseUpdatePayload,
} from '../types/purchase';

export async function listPurchases(): Promise<PurchaseResponse[]> {
  return requestJson<PurchaseResponse[]>('/payments', { method: 'GET' });
}

export async function listPurchasesByUser(userId: number): Promise<PurchaseResponse[]> {
  return requestJson<PurchaseResponse[]>(`/payments/users/${userId}`, {
    method: 'GET',
  });
}

export async function getPurchase(purchaseId: number): Promise<PurchaseResponse> {
  return requestJson<PurchaseResponse>(`/payments/${purchaseId}`, { method: 'GET' });
}

export async function createPurchase(
  payload: PurchaseCreatePayload,
): Promise<PurchaseResponse> {
  return requestJson<PurchaseResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePurchase(
  purchaseId: number,
  payload: PurchaseUpdatePayload,
): Promise<PurchaseResponse> {
  return requestJson<PurchaseResponse>(`/payments/${purchaseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePurchase(
  purchaseId: number,
): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/payments/${purchaseId}`, {
    method: 'DELETE',
  });
}
