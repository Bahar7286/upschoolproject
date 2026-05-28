export interface GooglePlaceSummary {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number | null;
  user_rating_count?: number | null;
  types: string[];
  google_maps_uri: string;
  photo_url?: string;
  category?: string;
}

export interface GooglePlacesNearbyResponse {
  places: GooglePlaceSummary[];
  cached: boolean;
  radius_m: number;
}

export interface GooglePlaceDetail {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  formatted_address: string;
  rating?: number | null;
  user_rating_count?: number | null;
  website_uri: string;
  google_maps_uri: string;
  editorial_summary: string;
  opening_hours: string;
  types: string[];
  sources: { title: string; url: string }[];
  photo_url?: string;
  category?: string;
}

export interface ComputeRouteResponse {
  encoded_polyline: string;
  distance_m: number;
  duration_s: number;
  steps: { instruction: string; distance_m: number; duration_s: number }[];
}

export interface GeoCenterResponse {
  lat: number;
  lng: number;
  city_name: string;
  district_name: string;
}
