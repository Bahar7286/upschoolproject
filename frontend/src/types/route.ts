export interface RouteRecommendPayload {
  interests: string[];
  duration_minutes: number;
  budget: number;
}

export interface RouteCreatePayload {
  title: string;
  city: string;
  estimated_minutes: number;
  price: number;
  tags: string[];
  guide_id: number;
}

export interface RouteUpdatePayload {
  title?: string;
  city?: string;
  estimated_minutes?: number;
  price?: number;
  tags?: string[];
  guide_id?: number;
}

export interface RouteResponse {
  route_id: number;
  title: string;
  city: string;
  estimated_minutes: number;
  price: number;
  tags: string[];
  guide_id: number;
}
