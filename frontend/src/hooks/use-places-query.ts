import { useQuery } from '@tanstack/react-query';

import { listPlaceCategories, listPlaces } from '../services/place-service';
import type { PlaceCategory } from '../types/place';

export function usePlacesQuery(category?: PlaceCategory | null, city = 'Istanbul', district?: string | null) {
  return useQuery({
    queryKey: ['places', city, district ?? 'all', category ?? 'all'],
    queryFn: () =>
      listPlaces({
        city,
        district: district ?? undefined,
        category: category ?? undefined,
        limit: 200,
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlaceCategoriesQuery(city = 'Istanbul') {
  return useQuery({
    queryKey: ['places', 'categories', city],
    queryFn: () => listPlaceCategories(city),
    staleTime: 10 * 60 * 1000,
  });
}
