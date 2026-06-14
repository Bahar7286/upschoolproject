import { Clock, MapPin, Star } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { ScoredRoute } from '../hooks/use-discover-recommendations';
import { isScoredRoute } from '../hooks/use-discover-recommendations';

type Props = {
  display: ScoredRoute[];
  effectiveInterests: string[];
  effectiveCity: string;
  hasRecommendData: boolean;
};

export function RouteRecommendationList({
  display,
  effectiveInterests,
  effectiveCity,
  hasRecommendData,
}: Props): ReactElement {
  return (
    <>
      <h2 className="font-display text-lg font-bold text-theme">
        {hasRecommendData ? 'Sana önerilen rotalar' : 'Rehber rotaları'}
      </h2>
      <p className="text-sm text-theme-muted">
        İlgi alanına ({effectiveInterests.slice(0, 3).join(', ')}) ve {effectiveCity} tercihine göre listeleniyor.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((route) => (
          <article className="theme-card overflow-hidden transition hover:-translate-y-1" key={route.route_id}>
            <div className="route-card-header relative p-5">
              {isScoredRoute(route) && route.aiScore != null ? (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-xs font-bold text-stone-900">
                  <Star className="h-3 w-3" aria-hidden="true" />%{Math.round(route.aiScore * 100)} uyum
                </span>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{route.city}</span>
                {route.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-full bg-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-100">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="route-card-title mt-3 text-lg font-bold leading-snug">{route.title}</h2>
            </div>
            <div className="space-y-3 p-5 text-theme">
              {isScoredRoute(route) && route.aiReason ? (
                <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  {route.aiReason}
                </p>
              ) : null}
              <p className="flex flex-wrap items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {route.estimated_minutes} dk
                </span>
                <Link
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  to={`/rehberler/${route.guide_id}`}
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Rehber profili
                </Link>
              </p>
              <p className="text-lg font-bold">₺{route.price.toFixed(2)}</p>
              <Link
                className="tap-scale inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-stone-300 font-semibold hover:border-primary dark:border-zinc-600"
                to={`/routes/${route.route_id}`}
              >
                Rotayı İncele
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
