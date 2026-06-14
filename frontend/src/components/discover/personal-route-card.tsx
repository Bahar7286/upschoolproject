import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../lib/i18n';
import type { PersonalRouteGenerateResponse } from '../../services/ai-service';

export function PersonalRouteCard({
  route,
  onOpenMap,
}: {
  route: PersonalRouteGenerateResponse;
  onOpenMap: () => void;
}): ReactElement {
  const { t } = useI18n();

  return (
    <article className="theme-card overflow-hidden border-2 border-primary/30">
      <div className="bg-primary/10 px-5 py-4 dark:bg-primary/20">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t('discover.personalRoute', 'AI Kişisel Rota')}
        </p>
        <h2 className="mt-2 font-display text-xl font-extrabold text-theme">{route.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-theme-muted">{route.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-theme-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 dark:bg-zinc-900/80">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {route.total_minutes} {t('discover.minutes', 'dk')}
          </span>
          <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-zinc-900/80">
            ₺{route.estimated_cost.toFixed(0)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 dark:bg-zinc-900/80">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {route.district ? `${route.district}, ` : ''}
            {route.city}
          </span>
        </div>
      </div>
      <ol className="divide-y divide-stone-900/5 dark:divide-white/10">
        {route.stops.map((stop) => (
          <li key={stop.order} className="flex gap-3 px-5 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {stop.order}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-theme">{stop.name}</p>
              {stop.reason ? (
                <p className="mt-0.5 text-xs leading-relaxed text-theme-muted">{stop.reason}</p>
              ) : null}
              {stop.narration_snippet ? (
                <p className="mt-1 text-xs italic leading-relaxed text-theme-muted">{stop.narration_snippet}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-theme-muted">
                ~{stop.dwell_minutes} {t('discover.minutes', 'dk')}
                {stop.category ? ` · ${stop.category}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 border-t border-stone-900/5 p-4 dark:border-white/10 sm:flex-row">
        <button
          type="button"
          className="tap-scale inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary font-bold text-white"
          onClick={onOpenMap}
        >
          {t('discover.openOnMap', 'Haritada aç')}
        </button>
        <Link
          className="tap-scale inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-stone-300 font-semibold dark:border-zinc-600"
          to="/assistant"
        >
          {t('discover.askAssistant', 'Asistana sor')}
        </Link>
      </div>
    </article>
  );
}
