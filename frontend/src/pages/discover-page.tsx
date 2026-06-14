import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Sparkles, Star } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { DiscoverLoading } from '../components/loading/discover-loading';
import { ListSkeleton } from '../components/loading/page-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorAlert } from '../components/ui/error-alert';
import { DEMO_ROUTES } from '../data/demo-routes';
import { EMPTY_STATES } from '../content/empty-states';
import { useI18n } from '../lib/i18n';
import { recommendWithAi, generatePersonalRoute, type AIRecommendationItem, type PersonalRouteGenerateResponse } from '../services/ai-service';
import { listCities } from '../services/city-service';
import { fetchGeoCenter } from '../services/google-service';
import { useActiveRouteStore } from '../stores/active-route-store';
import { PersonalRouteCard } from '../components/discover/personal-route-card';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { mapError } from '../lib/user-errors';
import { recommendRoutes } from '../services/route-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import type { RouteResponse } from '../types/route';
import { cityNamesMatch, filterRoutesByCity } from '../utils/city-match';

type ScoredRoute = RouteResponse & { aiScore?: number; aiReason?: string };

function isScoredRoute(route: RouteResponse | ScoredRoute): route is ScoredRoute {
  return 'aiScore' in route && typeof (route as ScoredRoute).aiScore === 'number';
}

export default function DiscoverPage(): ReactElement {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { data: routes = [], isPending, isError, error, refetch } = useRoutesQuery();
  const usingOfflineDemo = isError && routes.length === 0;
  const routeSource = usingOfflineDemo ? DEMO_ROUTES : routes;
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
  const [dismissRecommendError, setDismissRecommendError] = useState(false);
  const [dismissListError, setDismissListError] = useState(false);

  const effectiveCity =
    cityFilter || user?.preferred_city || preferredCity || 'İstanbul';

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const matchedCity = useMemo(
    () => cities.find((c) => cityNamesMatch(c.name_tr, effectiveCity)) ?? null,
    [cities, effectiveCity],
  );

  const { data: geoCenter } = useQuery({
    queryKey: ['geo-center-discover', matchedCity?.city_id],
    queryFn: () => fetchGeoCenter({ cityId: matchedCity!.city_id }),
    enabled: Boolean(matchedCity?.city_id),
    staleTime: 60 * 60 * 1000,
  });

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

  const navigate = useNavigate();
  const [personalRoute, setPersonalRoute] = useState<PersonalRouteGenerateResponse | null>(null);
  const setActiveRoute = useActiveRouteStore((s) => s.setActiveRoute);

  const openPersonalRouteOnMap = (route: PersonalRouteGenerateResponse) => {
    const stops = route.stops.map((s, idx) => ({
      stop_id: -(idx + 1),
      route_id: 0,
      title: s.name,
      description: s.narration_snippet || s.reason,
      latitude: s.lat,
      longitude: s.lng,
      order_index: s.order,
      audio_url: null,
    }));
    setActiveRoute(0, route.title, stops);
    navigate(`/map?city=${encodeURIComponent(route.city)}`);
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      setSlowRecommend(false);
      const slowTimer = window.setTimeout(() => setSlowRecommend(true), 8000);
      try {
        const personal = await generatePersonalRoute({
          city: matchedCity?.name_tr ?? effectiveCity,
          interests: effectiveInterests,
          duration_minutes: effectiveDuration,
          budget: effectiveBudget,
          preferred_language: 'tr',
          location_lat: geoCenter?.lat,
          location_lng: geoCenter?.lng,
          max_stops: Math.min(8, Math.max(3, Math.round(effectiveDuration / 45))),
        });
        setPersonalRoute(personal);
        return personal;
      } finally {
        window.clearTimeout(slowTimer);
        setSlowRecommend(false);
      }
    },
  });

  const recommendMutation = useMutation({
    mutationFn: async () => {
      setSlowRecommend(false);
      const slowTimer = window.setTimeout(() => setSlowRecommend(true), 5000);
      try {
        const fallbackRoutes = await recommendRoutes({
          interests: effectiveInterests,
          duration_minutes: effectiveDuration,
          budget: effectiveBudget,
        }).catch(() => routeSource);

        const aiTimeout = new Promise<AIRecommendationItem[]>((resolve) => {
          window.setTimeout(() => resolve([]), 12_000);
        });
        const aiItems = await Promise.race([
          recommendWithAi({
            interests: effectiveInterests,
            duration_minutes: effectiveDuration,
            budget: effectiveBudget,
            max_results: 12,
          }).catch(() => [] as AIRecommendationItem[]),
          aiTimeout,
        ]);

        const byId = new Map(routeSource.map((r) => [r.route_id, r]));
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
        if (scored.length === 0) return filterRoutesByCity(routeSource, effectiveCity);
        return filterRoutesByCity(scored, effectiveCity);
      } finally {
        window.clearTimeout(slowTimer);
        setSlowRecommend(false);
      }
    },
  });

  const showAiPanel = searchParams.get('ai') === '1' || personalRoute != null || recommendMutation.data != null;

  useEffect(() => {
    if (searchParams.get('ai') !== '1') return;
    if (generateMutation.isPending || generateMutation.isSuccess) return;
    if (!canUseAi()) return;
    generateMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca landing ?ai=1 ile bir kez
  }, [searchParams.get('ai')]);

  const display = useMemo(() => {
    const base = recommendMutation.data?.length
      ? recommendMutation.data
      : routes.length > 0
        ? routes
        : routeSource;
    return filterRoutesByCity(base, effectiveCity);
  }, [recommendMutation.data, routes, routeSource, effectiveCity]);

  const strictCityEmpty = useMemo(() => {
    const base = recommendMutation.data?.length
      ? recommendMutation.data
      : routes.length > 0
        ? routes
        : routeSource;
    return base.length > 0 && base.every((r) => !cityNamesMatch(r.city, effectiveCity));
  }, [recommendMutation.data, routes, routeSource, effectiveCity]);

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
          İlgi alanın, süren ve bütçene göre sana en uygun rotaları öneririz.
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
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-primary-dark dark:text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t('discover.aiWizard', 'AI Rota Sihirbazı')}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('discover.aiWizardHint', 'Eşleşme skoru, bütçe uyumu, süre ve konum yakınlığı birlikte hesaplanır.')}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t('discover.interests', 'İlgi alanları')}
            </p>
            <div className="flex flex-wrap gap-2">
              {effectiveInterests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-primary/25 bg-white px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-zinc-900 dark:text-stone-200"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm dark:bg-zinc-900 dark:text-stone-200">
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {effectiveDuration} {t('discover.minutes', 'dk')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm dark:bg-zinc-900 dark:text-stone-200">
              ₺{effectiveBudget}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm dark:bg-zinc-900 dark:text-stone-200">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {effectiveCity}
            </span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60 sm:flex-1"
              type="button"
              disabled={generateMutation.isPending}
              onClick={() => {
                setPremiumMsg('');
                setDismissRecommendError(false);
                if (!canUseAi()) {
                  setPremiumMsg(
                    t(
                      'discover.aiLimit',
                      'Ücretsiz planda günlük AI öneri limiti doldu. Premium ile sınırsız kullanabilirsin.',
                    ),
                  );
                  return;
                }
                generateMutation.mutate();
              }}
            >
              {generateMutation.isPending
                ? t('discover.aiLoading', 'Kişisel rota oluşturuluyor…')
                : t('discover.aiCta', 'Kişisel Rotanı Oluştur')}
            </button>
            {personalRoute ? (
              <button
                className="tap-scale min-h-[48px] rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600 sm:w-auto"
                type="button"
                onClick={() => {
                  setPersonalRoute(null);
                  generateMutation.reset();
                }}
              >
                {t('discover.clearRoute', 'Temizle')}
              </button>
            ) : null}
            {recommendMutation.data ? (
              <button
                className="tap-scale min-h-[48px] rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600 sm:w-auto"
                type="button"
                onClick={() => recommendMutation.reset()}
              >
                {t('discover.allRoutes', 'Tüm rotalar')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {usingOfflineDemo ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {t('discover.offlineDemo', 'Sunucuya ulaşılamadı — örnek rotalar gösteriliyor.')}{' '}
          <span className="block mt-1 text-xs opacity-90">
            {t('discover.offlineDemoHint', 'Bağlantı düzelince sayfayı yenileyin veya İller sekmesinden keşfe devam edin.')}
          </span>
        </p>
      ) : null}

      {premiumMsg ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-950 dark:text-amber-100" role="status">
          {premiumMsg} <Link className="font-bold text-primary underline" to="/premium">Premium</Link>
        </div>
      ) : null}

      {generateMutation.isPending && routes.length === 0 ? <DiscoverLoading /> : null}
      {generateMutation.isPending && routes.length > 0 ? (
        <p
          className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary"
          role="status"
        >
          {t('discover.aiLoading', 'Kişisel rota oluşturuluyor…')}
        </p>
      ) : null}
      {slowRecommend && generateMutation.isPending ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
          Öneriler biraz uzun sürdü. Popüler rotaları aşağıda inceleyebilirsin.
        </p>
      ) : null}

      {personalRoute && personalRoute.stops.length > 0 ? (
        <PersonalRouteCard route={personalRoute} onOpenMap={() => openPersonalRouteOnMap(personalRoute)} />
      ) : null}

      {generateMutation.isError ? (
        <ErrorAlert
          error={mapError(generateMutation.error, 'route-recommendations')}
          onRetry={() => generateMutation.mutate()}
        />
      ) : null}

      {recommendMutation.isPending && routes.length === 0 ? null : null}

      {listError && display.length === 0 && !dismissListError && !usingOfflineDemo ? (
        <ErrorAlert
          error={{
            ...listError,
            message:
              listError.kind === 'network'
                ? 'Rota listesi şu an yüklenemedi. İl ve mekan keşfine devam edebilirsin.'
                : listError.message,
            alternative: 'İlk yükleme biraz sürebilir; birkaç saniye sonra yenilemeyi dene.',
            actionLabel: 'İlleri keşfet',
            actionTo: '/cities',
          }}
          onDismiss={() => setDismissListError(true)}
          onRetry={() => {
            setDismissListError(false);
            void refetch();
          }}
        />
      ) : null}
      {recommendError && !dismissRecommendError && display.length === 0 && !recommendMutation.isPending ? (
        <ErrorAlert
          error={{
            ...recommendError,
            message:
              recommendError.kind === 'network'
                ? 'Kişisel öneri şu an alınamadı; aşağıdaki rotaları inceleyebilirsin.'
                : recommendError.message,
            alternative: 'Asistan sekmesinden soru sorarak da plan yapabilirsin.',
            actionLabel: 'Asistana git',
            actionTo: '/assistant',
          }}
          onDismiss={() => setDismissRecommendError(true)}
          onRetry={() => {
            setDismissRecommendError(false);
            recommendMutation.mutate();
          }}
        />
      ) : null}

      {strictCityEmpty ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100" role="status">
          <strong>{effectiveCity}</strong> için henüz kayıtlı rota yok; mevcut rotalar gösteriliyor.{' '}
          <Link className="font-bold text-primary underline" to="/cities">
            İlleri keşfet
          </Link>
        </p>
      ) : null}

      {isPending && routes.length === 0 ? (
        <ListSkeleton count={6} />
      ) : display.length === 0 && !personalRoute ? (
        <EmptyState
          {...EMPTY_STATES.search}
          title="Henüz rota yok"
          description={`${effectiveCity} için rehber rotası bulunamadı. İllere göz atabilir veya AI ile kişisel rota oluşturabilirsin.`}
          actionLabel="İlleri keşfet"
          actionTo="/cities"
        />
      ) : display.length > 0 ? (
        <>
          <h2 className="font-display text-lg font-bold text-theme">
            {recommendMutation.data?.length ? 'Sana önerilen rotalar' : 'Rehber rotaları'}
          </h2>
          <p className="text-sm text-theme-muted">
            İlgi alanına ({effectiveInterests.slice(0, 3).join(', ')}) ve {effectiveCity} tercihine göre listeleniyor.
          </p>
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
      ) : null}

      <p className="text-center text-sm text-stone-500">
        <Link className="font-bold text-primary hover:underline" to="/rehberler">
          Onaylı rehberlerden seç →
        </Link>
        {' · '}
        <Link className="font-bold text-primary hover:underline" to={`/map?city=${encodeURIComponent(effectiveCity)}`}>
          Haritada {effectiveCity} yerlerini gör →
        </Link>
      </p>
    </section>
  );
}
