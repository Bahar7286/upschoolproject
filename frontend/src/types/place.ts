export type PlaceCategory =
  | 'museum'
  | 'palace'
  | 'historical'
  | 'mosque'
  | 'bazaar'
  | 'street'
  | 'restaurant'
  | 'accommodation';

export interface PlaceResponse {
  place_id: number;
  name: string;
  category: PlaceCategory;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  description: string;
  tags: string[];
  is_partner: boolean;
}

export interface PlaceNearbyResponse extends PlaceResponse {
  distance_m: number;
}

export interface PlaceCategoryCount {
  category: string;
  count: number;
}

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  museum: 'Müze',
  palace: 'Saray',
  historical: 'Tarihi',
  mosque: 'Cami',
  bazaar: 'Çarşı',
  street: 'Sokak',
  restaurant: 'Yemek',
  accommodation: 'Konaklama',
};

export const PLACE_CATEGORY_COLORS: Record<PlaceCategory, string> = {
  museum: '#2563eb',
  palace: '#c9a227',
  historical: '#7c3aed',
  mosque: '#059669',
  bazaar: '#ea580c',
  street: '#64748b',
  restaurant: '#dc2626',
  accommodation: '#0891b2',
};
