import { useQuery } from '@tanstack/react-query';

import { listPlaceCategories, listPlaces } from '../services/place-service';
import type { PlaceCategory } from '../types/place';

export function usePlacesQuery(category?: PlaceCategory | null, city = 'Istanbul') {
  return useQuery({
    queryKey: ['places', city, category ?? 'all'],
    queryFn: () =>
      listPlaces({
        city,
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
