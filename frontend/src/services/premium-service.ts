import { requestJsonWithAuth } from '../lib/api';

export interface PremiumRequestStatus {
  has_pending: boolean;
  is_premium: boolean;
  last_status: string | null;
}

export async function fetchPremiumRequestStatus(accessToken: string): Promise<PremiumRequestStatus> {
  return requestJsonWithAuth<PremiumRequestStatus>('/auth/me/premium-request', accessToken);
}

export async function submitPremiumRequest(
  accessToken: string,
  message = '',
): Promise<void> {
  await requestJsonWithAuth<void>('/auth/me/premium-request', accessToken, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export interface AdminPremiumRequestItem {
  request_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: string;
  message: string;
  admin_note: string;
  created_at: string;
  reviewed_at: string | null;
}

export async function listPremiumRequests(accessToken: string): Promise<AdminPremiumRequestItem[]> {
  return requestJsonWithAuth<AdminPremiumRequestItem[]>('/admin/premium-requests', accessToken);
}

export async function reviewPremiumRequest(
  accessToken: string,
  requestId: number,
  action: 'approve' | 'reject',
  adminNote = '',
): Promise<void> {
  await requestJsonWithAuth(`/admin/premium-requests/${requestId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ action, admin_note: adminNote }),
  });
}
