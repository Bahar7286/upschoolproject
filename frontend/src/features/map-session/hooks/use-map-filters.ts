import { useEffect, useState } from 'react';

import type { PlaceCategory } from '../../../types/place';

const ALL_CATEGORIES: PlaceCategory[] = [
  'museum',
  'palace',
  'historical',
  'mosque',
  'bazaar',
  'street',
  'restaurant',
  'accommodation',
];

export function useMapFilters(categoryParam: PlaceCategory | null, districtIdParam: number) {
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategory | null>(null);
  const [showPlaces, setShowPlaces] = useState(true);
  const [placesRadius, setPlacesRadius] = useState(() => (districtIdParam > 0 ? 4000 : 10000));

  useEffect(() => {
    if (categoryParam && ALL_CATEGORIES.includes(categoryParam)) {
      setCategoryFilter(categoryParam);
    }
  }, [categoryParam]);

  return {
    categoryFilter,
    setCategoryFilter,
    showPlaces,
    setShowPlaces,
    placesRadius,
    setPlacesRadius,
    allCategories: ALL_CATEGORIES,
  };
}
