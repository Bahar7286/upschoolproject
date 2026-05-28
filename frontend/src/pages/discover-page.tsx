import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Sparkles, Star } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { DiscoverLoading } from '../components/loading/discover-loading';
import { ListSkeleton } from '../components/loading/page-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorAlert } from '../components/ui/error-alert';
import { EMPTY_STATES } from '../content/empty-states';
import { fetchAiStatus, recommendWithAi, type AIRecommendationItem } from '../services/ai-service';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { mapError } from '../lib/user-errors';
import { recommendRoutes } from '../services/route-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import type { RouteResponse } from '../types/route';

type ScoredRoute = RouteResponse & { aiScore?: number; aiReason?: string };

function isScoredRoute(route: RouteResponse | ScoredRoute): route is ScoredRoute {
  return 'aiScore' in route && typeof (route as ScoredRoute).aiScore === 'number';
}

export default function DiscoverPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { data: routes = [], isPending, isError, error } = useRoutesQuery();
  const { data: aiStatus } = useQuery({
    queryKey: ['ai', 'status'],
    queryFn: fetchAiStatus,
    staleTime: 60_000,
  });

  const interests = useOnboardingStore((s) => s.interests);
  const durationMinutes = useOnboardingStore((s) => s.durationMinutes);
  const budget = useOnboardingStore((s) => s.budget);
  const preferredCity = useOnboardingStore((s) => s.preferredCity);
  const cityFilter = searchParams.get('city')?.trim();

  const effectiveInterests = interests.length ? interests : user?.interests?.length ? user.interests : ['history', 'art', 'food'];
  const effectiveDuration = durationMinutes || user?.duration_minutes || 120;
  const effectiveBudget = budget || user?.budget || 150;
  const [premiumMsg, setPremiumMsg] = useState('');
  const [slowRecommend, setSlowRecommend] = useState(false);

  const effectiveCity =
    cityFilter || user?.preferred_city || preferredCity || 'İstanbul';

  const canUseAi = () => {
    if (user?.is_premium) return true;
    const uid = user?.user_id ?? 0;
    const day = new Date().toISOString().slice(0, 10);
    const key = `hg_ai_daily_${uid}_${day}`;
    const used = Number(localStorage.getItem(key) ?? '0');
    if (used >= 3) return false;
    localStorage.setItem(key, String(used + 1));
    return true;
  };

  const recommendMutation = useMutation({
    mutationFn: async () => {
      setSlowRecommend(false);
      const slowTimer = window.setTimeout(() => setSlowRecommend(true), 10_000);
      try {
        const [aiItems, fallbackRoutes] = await Promise.all([
          recommendWithAi({
            interests: effectiveInterests,
            duration_minutes: effectiveDuration,
            budget: effectiveBudget,
            max_results: 12,
          }).catch(() => [] as AIRecommendationItem[]),
          recommendRoutes({
            interests: effectiveInterests,
            duration_minutes: effectiveDuration,
            budget: effectiveBudget,
          }),
        ]);
        const byId = new Map(routes.map((r) => [r.route_id, r]));
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
        if (scored.length === 0) return routes;
        const cityNorm = effectiveCity.toLowerCase();
        const cityFiltered = scored.filter((r) => r.city.toLowerCase().includes(cityNorm));
        return cityFiltered.length > 0 ? cityFiltered : scored;
      } finally {
        window.clearTimeout(slowTimer);
        setSlowRecommend(false);
      }
    },
  });

  const showAiPanel = searchParams.get('ai') === '1' || recommendMutation.data != null;

  useEffect(() => {
    if (searchParams.get('ai') !== '1' || routes.length === 0) return;
    if (recommendMutation.isPending || recommendMutation.isSuccess) return;
    recommendMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca landing ?ai=1 ile bir kez
  }, [searchParams.get('ai'), routes.length]);

  const display = useMemo(() => {
    const base = recommendMutation.data?.length ? recommendMutation.data : routes;
    if (!cityFilter) return base;
    const norm = cityFilter.toLowerCase();
    const filtered = base.filter((r) => r.city.toLowerCase().includes(norm));
    return filtered.length > 0 ? filtered : base;
  }, [recommendMutation.data, routes, cityFilter]);

  const listError = isError ? mapError(error, 'discover') : null;
  const recommendError = recommendMutation.isError
    ? mapError(recommendMutation.error, 'route-recommendations')
    : null;

  const firstName = user?.full_name?.split(/\s+/)[0];

  return (
    <section className="space-y-6" aria-labelledby="disc-title">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme md:text-4xl" id="disc-title">
          {firstName ? `Merhaba, ${firstName}! 👋` : 'Rota keşfi'}
        </h1>
        <p className="text-sm leading-relaxed text-theme-muted md:text-base">
          AI motoru ilgi alanı, süre ve bütçene göre skorlar; en uygun rotalar üstte listelenir.
          {aiStatus?.llm_enabled ? (
            <span className="mt-1 block text-xs font-semibold text-primary">
              LLM aktif ({aiStatus.provider} · {aiStatus.model})
            </span>
          ) : (
            <span className="mt-1 block text-xs text-theme-muted">
              Yerel skor motoru (LLM anahtarı ekleyince OpenRouter/Gemini devreye girer)
            </span>
          )}
        </p>
        {user?.onboarding_completed ? (
          <p className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {effectiveCity}
            <span className="text-stone-400">·</span>
            {effectiveInterests.slice(0, 3).join(', ')}
            {effectiveInterests.length > 3 ? '…' : ''}
            <Link className="text-primary underline-offset-2 hover:underline" to="/onboarding">
              Tercihleri düzenle
            </Link>
          </p>
        ) : (
          <Link className="inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline" to="/onboarding">
            Kişisel rotanı oluştur →
          </Link>
        )}
      </header>

      <div
        className={`rounded-[22px] border p-5 transition ${
          showAiPanel
            ? 'border-primary/35 bg-primary/8 dark:border-primary/40 dark:bg-primary/15'
            : 'border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 flex-1">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-primary-dark dark:text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI Rota Sihirbazı
            </p>
            <p className="break-anywhere text-sm text-stone-700 dark:text-stone-300">
              <strong>İlgi:</strong> {effectiveInterests.join(', ')} · <strong>Süre:</strong> {effectiveDuration} dk ·{' '}
              <strong>Bütçe:</strong> ₺{effectiveBudget}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Eşleşme skoru, bütçe uyumu, süre ve konum yakınlığı birlikte hesaplanır.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
              type="button"
              disabled={recommendMutation.isPending}
              onClick={() => {
                setPremiumMsg('');
                if (!canUseAi()) {
                  setPremiumMsg('Ücretsiz planda günlük AI öneri limiti doldu. Premium ile sınırsız kullanabilirsin.');
                  return;
                }
                recommendMutation.mutate();
              }}
            >
              {recommendMutation.isPending ? 'Kişisel öneriler hazırlanıyor…' : 'Kişisel Rotanı Oluştur'}
            </button>
            {recommendMutation.data ? (
              <button
                className="tap-scale min-h-[48px] rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600"
                type="button"
                onClick={() => recommendMutation.reset()}
              >
                Tüm rotalar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {premiumMsg ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-950 dark:text-amber-100" role="status">
          {premiumMsg} <Link className="font-bold text-primary underline" to="/premium">Premium</Link>
        </div>
      ) : null}

      {recommendMutation.isPending ? <DiscoverLoading /> : null}
      {slowRecommend && recommendMutation.isPending ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
          Öneriler biraz uzun sürdü. Popüler rotaları aşağıda inceleyebilirsin.
        </p>
      ) : null}

      {listError ? <ErrorAlert error={listError} /> : null}
      {recommendError ? (
        <ErrorAlert
          error={recommendError}
          onRetry={() => recommendMutation.mutate()}
        />
      ) : null}

      {isPending ? (
        <ListSkeleton count={6} />
      ) : display.length === 0 ? (
        <EmptyState {...EMPTY_STATES.search} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map((route) => (
            <article
              className="theme-card overflow-hidden transition hover:-translate-y-1"
              key={route.route_id}
            >
              <div className="route-card-header relative p-5">
                {isScoredRoute(route) && route.aiScore != null ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-xs font-bold text-stone-900">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    %{Math.round(route.aiScore * 100)} uyum
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{route.city}</span>
                  {route.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full bg-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-100">
                      {t}
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
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Rehber #{route.guide_id}
                  </span>
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
      )}

      <p className="text-center text-sm text-stone-500">
        <Link className="font-bold text-primary hover:underline" to="/rehberler">
          Onaylı rehberlerden seç →
        </Link>
        {' · '}
        <Link className="font-bold text-primary hover:underline" to="/map">
          Haritada tüm İstanbul yerlerini gör →
        </Link>
      </p>
    </section>
  );
}
