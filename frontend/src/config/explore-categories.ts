import type { LucideIcon } from 'lucide-react';
import { BedDouble, Building2, Church, Landmark, MapPin, Utensils } from 'lucide-react';

import type { PlaceCategory } from '../types/place';

export type ExploreCategoryDef = {
  id: PlaceCategory;
  labelKey: string;
  descKey: string;
  emoji?: string;
  icon?: LucideIcon;
};

/** İl sayfası — her kategori ayrı etiket (hepsi "Gezilecek" değil). */
export const CITY_EXPLORE_CATEGORIES: ExploreCategoryDef[] = [
  { id: 'museum', labelKey: 'placeCategory.museum', descKey: 'city.catDesc.museum', emoji: '🏛️' },
  { id: 'historical', labelKey: 'placeCategory.historical', descKey: 'city.catDesc.historical', emoji: '🏰' },
  { id: 'mosque', labelKey: 'placeCategory.mosque', descKey: 'city.catDesc.mosque', emoji: '🕌' },
  { id: 'palace', labelKey: 'placeCategory.palace', descKey: 'city.catDesc.palace', emoji: '👑' },
  { id: 'restaurant', labelKey: 'placeCategory.restaurant', descKey: 'city.catDesc.restaurant', emoji: '🍽️' },
  { id: 'accommodation', labelKey: 'placeCategory.accommodation', descKey: 'city.catDesc.accommodation', emoji: '🛏️' },
];

/** İlçe hub — gezilecek alt türleri ayrı kartlar. */
export const DISTRICT_HUB_CATEGORIES: ExploreCategoryDef[] = [
  { id: 'museum', labelKey: 'placeCategory.museum', descKey: 'city.catDesc.museum', icon: Landmark },
  { id: 'historical', labelKey: 'placeCategory.historical', descKey: 'city.catDesc.historical', icon: Building2 },
  { id: 'mosque', labelKey: 'placeCategory.mosque', descKey: 'city.catDesc.mosque', icon: Church },
  { id: 'palace', labelKey: 'placeCategory.palace', descKey: 'city.catDesc.palace', icon: MapPin },
  { id: 'restaurant', labelKey: 'placeCategory.restaurant', descKey: 'city.catDesc.restaurant', icon: Utensils },
  { id: 'accommodation', labelKey: 'placeCategory.accommodation', descKey: 'city.catDesc.accommodation', icon: BedDouble },
];
