export interface CityResponse {
  city_id: number;
  name_tr: string;
  slug: string;
  plate_code: string;
  center_lat: number;
  center_lng: number;
}

export interface DistrictResponse {
  district_id: number;
  city_id: number;
  name_tr: string;
  slug: string;
  center_lat: number;
  center_lng: number;
}

