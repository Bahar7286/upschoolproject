import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../lib/query-keys';
import { listRoutes } from '../services/route-service';

export function useRoutesQuery() {
  return useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: listRoutes,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
