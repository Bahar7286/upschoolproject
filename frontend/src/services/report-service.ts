import { requestJsonWithAuth } from '../lib/api';

export interface ContentReportPayload {
  entity_type: 'route' | 'place' | 'review' | 'guide';
  entity_id: number;
  reason: string;
  details?: string;
}

export interface ContentReportResponse {
  report_id: number;
  entity_type: string;
  entity_id: number;
  reason: string;
  details: string;
  status: string;
  created_at: string;
}

export async function submitContentReport(
  accessToken: string,
  payload: ContentReportPayload,
): Promise<ContentReportResponse> {
  return requestJsonWithAuth('/reports', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
