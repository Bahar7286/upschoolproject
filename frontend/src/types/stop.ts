export interface StopCreatePayload {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  order_index?: number;
  audio_url?: string | null;
}

export interface StopUpdatePayload {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  order_index?: number;
  audio_url?: string | null;
}

export interface StopResponse {
  stop_id: number;
  route_id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  order_index: number;
  audio_url: string | null;
}
