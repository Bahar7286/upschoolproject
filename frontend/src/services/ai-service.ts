import { ASSISTANT_REQUEST_TIMEOUT_MS, RECOMMEND_TIMEOUT_MS, requestJson } from '../lib/api';

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
  return requestJson<AIStatusResponse>('/ai/status', { skipWake: true, timeoutMs: 15_000 });
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
    timeoutMs: RECOMMEND_TIMEOUT_MS,
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
  sources?: { title: string; url: string }[];
}

export interface NarrationPreviewPayload {
  stop_title: string;
  description?: string;
  languages?: ('tr' | 'en' | 'de')[];
}

export interface NarrationPreviewResponse {
  stop_title: string;
  scripts: Record<string, string>;
  note?: string;
  sources?: { title: string; url: string }[];
}

export async function fetchNarrationPreview(
  payload: NarrationPreviewPayload,
): Promise<NarrationPreviewResponse> {
  return requestJson<NarrationPreviewResponse>('/ai/narration/preview', {
    method: 'POST',
    body: JSON.stringify({
      languages: ['tr'],
      ...payload,
    }),
  });
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

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatPayload {
  city?: string;
  district?: string;
  interests?: string[];
  messages: AssistantMessage[];
  preferred_language?: 'tr' | 'en' | 'de';
  location_lat?: number;
  location_lng?: number;
}

export interface AssistantChatResponse {
  reply: string;
  source: string;
}

export interface PersonalRouteStop {
  order: number;
  name: string;
  lat: number;
  lng: number;
  category: string;
  reason: string;
  dwell_minutes: number;
  place_id: number | null;
  narration_snippet: string;
}

export interface PersonalRouteGeneratePayload {
  city: string;
  district?: string;
  interests: string[];
  duration_minutes: number;
  budget: number;
  preferred_language?: 'tr' | 'en' | 'de';
  location_lat?: number;
  location_lng?: number;
  max_stops?: number;
}

export interface PersonalRouteGenerateResponse {
  title: string;
  summary: string;
  city: string;
  district: string;
  total_minutes: number;
  estimated_cost: number;
  stops: PersonalRouteStop[];
  source: string;
}

export async function generatePersonalRoute(
  payload: PersonalRouteGeneratePayload,
): Promise<PersonalRouteGenerateResponse> {
  return requestJson<PersonalRouteGenerateResponse>('/ai/routes/generate', {
    method: 'POST',
    timeoutMs: ASSISTANT_REQUEST_TIMEOUT_MS,
    body: JSON.stringify(payload),
  });
}

export async function assistantChat(payload: AssistantChatPayload): Promise<AssistantChatResponse> {
  return requestJson<AssistantChatResponse>('/ai/assistant/chat', {
    method: 'POST',
    timeoutMs: ASSISTANT_REQUEST_TIMEOUT_MS,
    body: JSON.stringify(payload),
  });
}
