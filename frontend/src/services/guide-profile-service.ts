import { requestJson, requestJsonWithAuth, requestMultipartWithAuth } from '../lib/api';

export interface GuideMarketplaceItem {
  guide_id: number;
  full_name: string;
  verification_status: string;
  is_verified: boolean;
  languages: string[];
  regions: string[];
  specialties: string[];
  bio: string;
  route_count: number;
  base_price_per_person: number;
  min_group_size: number;
  max_group_size: number;
  trust_badges: string[];
}

export interface GuideProfile extends GuideMarketplaceItem {
  email: string;
  license_number: string;
  license_type: string;
  university: string;
  department: string;
  graduation_year: number | null;
  document_summary: string;
  document_path?: string;
}

export interface GuideVerificationPayload {
  license_number: string;
  license_type: 'regional' | 'national' | 'professional';
  university: string;
  department: string;
  graduation_year?: number | null;
  languages: string[];
  regions: string[];
  document_summary: string;
  bio: string;
  specialties: string[];
  min_group_size: number;
  max_group_size: number;
  base_price_per_person: number;
}

export async function listVerifiedGuides(): Promise<{ items: GuideMarketplaceItem[]; total: number }> {
  return requestJson('/guides/marketplace');
}

export async function getGuidePublicProfile(guideId: number): Promise<GuideProfile> {
  return requestJson(`/guides/${guideId}/public`);
}

export async function getMyGuideVerification(accessToken: string): Promise<GuideProfile | null> {
  return requestJsonWithAuth('/guides/me/verification', accessToken);
}

export async function submitGuideVerification(
  accessToken: string,
  payload: GuideVerificationPayload,
): Promise<GuideProfile> {
  return requestJsonWithAuth('/guides/me/verification', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadVerificationDocument(
  accessToken: string,
  file: File,
): Promise<GuideProfile> {
  const form = new FormData();
  form.append('file', file);
  return requestMultipartWithAuth('/guides/me/verification/document', accessToken, form);
}
