import { requestJsonWithAuth } from '../lib/api';
import { getApiBaseUrl } from '../lib/api';

export interface AdminPendingGuide {
  guide_id: number;
  full_name: string;
  email: string;
  verification_status: string;
  license_number: string;
  university: string;
  department: string;
  document_path: string;
  document_summary: string;
  submitted_at: string | null;
}

export async function listPendingGuides(accessToken: string): Promise<AdminPendingGuide[]> {
  return requestJsonWithAuth('/admin/guides/pending', accessToken);
}

export async function moderateGuide(
  accessToken: string,
  guideId: number,
  action: 'verify' | 'reject',
  rejectionReason = '',
): Promise<{ status: string }> {
  return requestJsonWithAuth(`/admin/guides/${guideId}/verification`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ action, rejection_reason: rejectionReason }),
  });
}

export function documentUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
