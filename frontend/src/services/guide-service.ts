import { requestJson } from '../lib/api';

export interface GuideEarningsResponse {
  guide_id: number;
  monthly_earnings: number;
  route_sales: number;
}

export async function getGuideEarnings(guideId: number): Promise<GuideEarningsResponse> {
  return requestJson<GuideEarningsResponse>(`/guides/${guideId}/earnings`, {
    method: 'GET',
  });
}
