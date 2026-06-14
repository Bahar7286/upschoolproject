import type { GooglePlaceSummary } from '../types/google';
import { PLACE_CATEGORY_COLORS, type PlaceCategory } from '../types/place';

const PLACE_CATEGORIES = new Set<string>(Object.keys(PLACE_CATEGORY_COLORS));

function isPlaceCategory(value: string): value is PlaceCategory {
  return PLACE_CATEGORIES.has(value);
}

/** Google Places types → uygulama kategorisi */
export function resolveGooglePlaceCategory(gp: GooglePlaceSummary): PlaceCategory {
  if (gp.category && isPlaceCategory(gp.category)) {
    return gp.category;
  }

  const types = new Set(gp.types.map((t) => t.toLowerCase()));
  if (types.has('restaurant') || types.has('cafe') || types.has('bakery') || types.has('meal_takeaway')) {
    return 'restaurant';
  }
  if (types.has('lodging') || types.has('hotel') || types.has('hostel') || types.has('guest_house')) {
    return 'accommodation';
  }
  if (types.has('mosque') || types.has('place_of_worship')) {
    return 'mosque';
  }
  if (types.has('shopping_mall') || types.has('market') || types.has('department_store')) {
    return 'bazaar';
  }
  if (types.has('museum') || types.has('art_gallery')) {
    return 'museum';
  }
  if (types.has('tourist_attraction') || types.has('historical_landmark') || types.has('church')) {
    return 'historical';
  }
  if (types.has('park')) {
    return 'street';
  }
  return 'historical';
}

export function googlePlacePinColor(gp: GooglePlaceSummary): string {
  return PLACE_CATEGORY_COLORS[resolveGooglePlaceCategory(gp)];
}
