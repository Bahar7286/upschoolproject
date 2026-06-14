import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { recommendWithAi, type AIRecommendationItem } from '../../../services/ai-service';
import { recommendRoutes } from '../../../services/route-service';
import type { RouteResponse } from '../../../types/route';
import { filterRoutesByCityStrict } from '../../../utils/city-match';

export type ScoredRoute = RouteResponse & { aiScore?: number; aiReason?: string };

export function isScoredRoute(route: RouteResponse | ScoredRoute): route is ScoredRoute {
  return 'aiScore' in route && typeof (route as ScoredRoute).aiScore === 'number';
}

type RecommendInput = {
  interests: string[];
  durationMinutes: number;
  budget: number;
  effectiveCity: string;
  routeSource: RouteResponse[];
};

export function useDiscoverRecommendations() {
  const [slowRecommend, setSlowRecommend] = useState(false);

  const recommendMutation = useMutation({
    mutationFn: async (input: RecommendInput) => {
      setSlowRecommend(false);
      const slowTimer = window.setTimeout(() => setSlowRecommend(true), 5000);
      try {
        const fallbackRoutes = await recommendRoutes({
          interests: input.interests,
          duration_minutes: input.durationMinutes,
          budget: input.budget,
        }).catch(() => input.routeSource);

        const aiTimeout = new Promise<AIRecommendationItem[]>((resolve) => {
          window.setTimeout(() => resolve([]), 12_000);
        });
        const aiItems = await Promise.race([
          recommendWithAi({
            interests: input.interests,
            duration_minutes: input.durationMinutes,
            budget: input.budget,
            max_results: 12,
          }).catch(() => [] as AIRecommendationItem[]),
          aiTimeout,
        ]);

        const byId = new Map(input.routeSource.map((r) => [r.route_id, r]));
        const scored: ScoredRoute[] = [];
        const seen = new Set<number>();

        for (const item of aiItems) {
          const route = byId.get(item.route_id);
          if (route && !seen.has(route.route_id)) {
            seen.add(route.route_id);
            scored.push({ ...route, aiScore: item.score, aiReason: item.reason });
          }
        }
        for (const route of fallbackRoutes) {
          if (!seen.has(route.route_id)) {
            seen.add(route.route_id);
            scored.push(route);
          }
        }
        if (scored.length === 0) return filterRoutesByCityStrict(input.routeSource, input.effectiveCity);
        return filterRoutesByCityStrict(scored, input.effectiveCity);
      } finally {
        window.clearTimeout(slowTimer);
        setSlowRecommend(false);
      }
    },
  });

  return { recommendMutation, slowRecommend, isScoredRoute };
}

export function useDiscoverDisplay(
  recommendData: ScoredRoute[] | undefined,
  routes: RouteResponse[],
  routeSource: RouteResponse[],
  effectiveCity: string,
) {
  return useMemo(() => {
    const base = recommendData?.length ? recommendData : routes.length > 0 ? routes : routeSource;
    return filterRoutesByCityStrict(base, effectiveCity);
  }, [recommendData, routes, routeSource, effectiveCity]);
}
