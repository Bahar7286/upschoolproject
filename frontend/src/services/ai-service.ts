import { requestJson } from '../lib/api';

export interface AIRecommendationItem {
  route_id: number;
  score: number;
  reason: string;
  matched_tags: string[];
  fits_budget: boolean;
  fits_duration: boolean;
  source?: 'llm' | 'rules' | string;
}

export interface AIStatusResponse {
  llm_enabled: boolean;
  provider: string | null;
  model: string | null;
  fallback_mode: string;
}

export async function fetchAiStatus(): Promise<AIStatusResponse> {
  return requestJson<AIStatusResponse>('/ai/status');
}

export interface AIRecommendPayload {
  interests: string[];
  duration_minutes: number;
  budget: number;
  location_lat?: number;
  location_lng?: number;
  max_results?: number;
}

export async function recommendWithAi(payload: AIRecommendPayload): Promise<AIRecommendationItem[]> {
  return requestJson<AIRecommendationItem[]>('/ai/recommend', {
    method: 'POST',
    body: JSON.stringify({
      location_lat: 41.0082,
      location_lng: 28.9784,
      max_results: 10,
      ...payload,
    }),
  });
}

export interface NarrationAudioPayload {
  stop_title: string;
  description?: string;
  language: 'tr' | 'en' | 'de';
}

export interface NarrationAudioResponse {
  stop_title: string;
  language: string;
  audio_base64: string | null;
  content_type: string;
  script: string;
  fallback_browser_tts: boolean;
}

export async function fetchNarrationAudio(
  payload: NarrationAudioPayload,
): Promise<NarrationAudioResponse> {
  return requestJson<NarrationAudioResponse>('/ai/narration/audio', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface GeofenceCheckPayload {
  route_id: number;
  latitude: number;
  longitude: number;
  radius_m?: number;
}

export interface GeofenceCheckResponse {
  triggered: boolean;
  distance_m?: number | null;
  stop_id?: number | null;
  stop_title?: string | null;
  audio_url?: string | null;
  message: string;
}

export async function checkGeofence(payload: GeofenceCheckPayload): Promise<GeofenceCheckResponse> {
  return requestJson<GeofenceCheckResponse>('/ai/geofence-check', {
    method: 'POST',
    body: JSON.stringify({
      radius_m: 20,
      ...payload,
    }),
  });
}
