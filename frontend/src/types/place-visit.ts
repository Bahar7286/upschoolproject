export interface AlsoVisitedItem {
  entity_type: 'place' | 'google_place';
  entity_key: string;
  place_id: number | null;
  google_place_id: string | null;
  name: string;
  city: string;
  category: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  co_visit_count: number;
  co_visit_percent: number;
}

export interface AlsoVisitedResponse {
  entity_type: string;
  entity_key: string;
  source_place_name: string;
  total_visitors: number;
  items: AlsoVisitedItem[];
}

export type PlaceVisitSource = 'view' | 'geofence' | 'favorite' | 'narration' | 'route';

export interface PlaceVisitPayload {
  entity_type: 'place' | 'google_place';
  entity_key: string;
  place_name?: string;
  city?: string;
  source?: PlaceVisitSource;
}
