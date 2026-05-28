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

export interface AdminPendingRoute {
  route_id: number;
  title: string;
  city: string;
  guide_id: number;
  status: string;
  price: number;
  estimated_minutes: number;
  submitted_at: string | null;
}

export interface ContentReportItem {
  report_id: number;
  entity_type: string;
  entity_id: number;
  reason: string;
  details: string;
  status: string;
  created_at: string;
}

export async function listPendingRoutes(accessToken: string): Promise<AdminPendingRoute[]> {
  return requestJsonWithAuth('/admin/routes/pending', accessToken);
}

export async function moderateRoute(
  accessToken: string,
  routeId: number,
  action: 'approve' | 'reject' | 'unpublish',
  publicFeedback = '',
): Promise<unknown> {
  return requestJsonWithAuth(`/admin/moderation/routes/${routeId}/decision`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ action, public_feedback: publicFeedback, reason_codes: '' }),
  });
}

export async function listOpenReports(accessToken: string): Promise<ContentReportItem[]> {
  return requestJsonWithAuth('/admin/reports', accessToken);
}

export async function resolveReport(
  accessToken: string,
  reportId: number,
  status: 'reviewed' | 'dismissed',
): Promise<ContentReportItem> {
  return requestJsonWithAuth(`/admin/reports/${reportId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function syncPoi(
  accessToken: string,
  params: { city_id?: number; district_id?: number },
): Promise<{ fetched: number; created: number; skipped_duplicates: number }> {
  const q = new URLSearchParams();
  if (params.city_id) q.set('city_id', String(params.city_id));
  if (params.district_id) q.set('district_id', String(params.district_id));
  return requestJsonWithAuth(`/admin/poi/sync?${q}`, accessToken, { method: 'POST' });
}

export async function setUserPremium(
  accessToken: string,
  userId: number,
  isPremium: boolean,
): Promise<{ status: string }> {
  return requestJsonWithAuth(`/admin/users/${userId}/premium`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ is_premium: isPremium }),
  });
}
