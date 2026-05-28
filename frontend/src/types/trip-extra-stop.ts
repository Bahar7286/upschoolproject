export interface TripExtraStop {
  extra_stop_id: number;
  route_id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  order_index: number;
  place_id: number | null;
  google_place_id: string | null;
  is_extra: boolean;
}

export interface TripExtraStopCreatePayload {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  place_id?: number | null;
  google_place_id?: string | null;
  insert_after_order_index?: number | null;
}
