import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Sparkles, Star } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { fetchAiStatus, recommendWithAi, type AIRecommendationItem } from '../services/ai-service';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { formatApiError } from '../lib/api';
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

  const effectiveInterests = interests.length ? interests : user?.interests?.length ? user.interests : ['history', 'art', 'food'];
  const effectiveDuration = durationMinutes || user?.duration_minutes || 120;
  const effectiveBudget = budget || user?.budget || 150;
  const [premiumMsg, setPremiumMsg] = useState('');

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
      return scored;
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
    if (recommendMutation.data?.length) return recommendMutation.data;
    return routes;
  }, [recommendMutation.data, routes]);

  const bannerError =
    (isError ? formatApiError(error) : '') ||
    (recommendMutation.isError ? formatApiError(recommendMutation.error) : '');

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
        {!user?.onboarding_completed && interests.length === 0 ? (
          <Link className="inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline" to="/onboarding">
            → İlgi alanlarını ayarla
          </Link>
        ) : null}
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
              {recommendMutation.isPending ? 'AI hesaplıyor…' : 'Kişisel önerileri getir'}
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

      {bannerError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {bannerError}
        </p>
      ) : null}

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div key={k} className="h-72 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-8 text-center dark:border-white/10 dark:bg-zinc-900/95">
          <p className="font-semibold">Henüz rota yok</p>
        </div>
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
                  Detay ve duraklar
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
