import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { DiscoverLoading } from '../components/loading/discover-loading';
import { ListSkeleton } from '../components/loading/page-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorAlert } from '../components/ui/error-alert';
import { PersonalRouteCard } from '../components/discover/personal-route-card';
import { DEMO_ROUTES } from '../data/demo-routes';
import {
  canUseAiDaily,
  DiscoverAiPanel,
  DiscoverHero,
  RouteRecommendationList,
  useDiscoverDisplay,
  useDiscoverRecommendations,
  usePersonalRoute,
} from '../features/discover';
import { useEmptyStates } from '../hooks/use-empty-states';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { useI18n } from '../lib/i18n';
import { mapError } from '../lib/user-errors';
import { listCities } from '../services/city-service';
import { fetchGeoCenter } from '../services/google-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import { cityNamesMatch } from '../utils/city-match';

export default function DiscoverPage(): ReactElement {
  const { t } = useI18n();
  const emptyStates = useEmptyStates();
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
  const effectiveCity = cityFilter || user?.preferred_city || preferredCity || 'İstanbul';
  const [premiumMsg, setPremiumMsg] = useState('');
  const [dismissRecommendError, setDismissRecommendError] = useState(false);
  const [dismissListError, setDismissListError] = useState(false);

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

  const { recommendMutation } = useDiscoverRecommendations();
  const {
    personalRoute,
    slowRecommend,
    generateMutation,
    openPersonalRouteOnMap,
    clearPersonalRoute,
  } = usePersonalRoute();
  const display = useDiscoverDisplay(recommendMutation.data, routes, routeSource, effectiveCity);
  const showAiPanel = searchParams.get('ai') === '1' || personalRoute != null || recommendMutation.data != null;
  const noCityRoutes = display.length === 0 && !personalRoute && !isPending;
  const listError = isError ? mapError(error, 'discover') : null;
  const recommendError = recommendMutation.isError ? mapError(recommendMutation.error, 'route-recommendations') : null;
  const firstName = user?.full_name?.split(/\s+/)[0];

  const runGenerate = () => {
    setPremiumMsg('');
    setDismissRecommendError(false);
    if (!canUseAiDaily()) {
      setPremiumMsg(t('discover.aiLimit', 'Ücretsiz planda günlük AI öneri limiti doldu. Premium ile sınırsız kullanabilirsin.'));
      return;
    }
    generateMutation.mutate({
      city: matchedCity?.name_tr ?? effectiveCity,
      interests: effectiveInterests,
      durationMinutes: effectiveDuration,
      budget: effectiveBudget,
      geoLat: geoCenter?.lat,
      geoLng: geoCenter?.lng,
    });
  };

  useEffect(() => {
    if (searchParams.get('ai') !== '1') return;
    if (generateMutation.isPending || generateMutation.isSuccess) return;
    if (!canUseAiDaily()) return;
    runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('ai')]);

  return (
    <section className="space-y-6" aria-labelledby="disc-title">
      <DiscoverHero
        firstName={firstName}
        effectiveCity={effectiveCity}
        effectiveInterests={effectiveInterests}
        onboardingCompleted={user?.onboarding_completed}
      />
      <DiscoverAiPanel
        showAiPanel={showAiPanel}
        effectiveInterests={effectiveInterests}
        effectiveDuration={effectiveDuration}
        effectiveBudget={effectiveBudget}
        effectiveCity={effectiveCity}
        isGenerating={generateMutation.isPending}
        hasPersonalRoute={Boolean(personalRoute)}
        hasRecommendData={Boolean(recommendMutation.data)}
        onGenerate={runGenerate}
        onClearPersonal={clearPersonalRoute}
        onClearRecommend={() => recommendMutation.reset()}
      />
      {usingOfflineDemo ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100" role="status">
          {t('discover.offlineDemo', 'Sunucuya ulaşılamadı — örnek rotalar gösteriliyor.')}
        </p>
      ) : null}
      {premiumMsg ? (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-950 dark:text-amber-100" role="status">
          {premiumMsg} <Link className="font-bold text-primary underline" to="/premium">Premium</Link>
        </div>
      ) : null}
      {generateMutation.isPending && routes.length === 0 ? <DiscoverLoading /> : null}
      {slowRecommend && generateMutation.isPending ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
          Öneriler biraz uzun sürdü. Popüler rotaları aşağıda inceleyebilirsin.
        </p>
      ) : null}
      {personalRoute && personalRoute.stops.length > 0 ? (
        <PersonalRouteCard route={personalRoute} onOpenMap={() => openPersonalRouteOnMap(personalRoute)} />
      ) : null}
      {generateMutation.isError ? (
        <ErrorAlert error={mapError(generateMutation.error, 'route-recommendations')} onRetry={runGenerate} />
      ) : null}
      {listError && display.length === 0 && !dismissListError && !usingOfflineDemo ? (
        <ErrorAlert
          error={{ ...listError, actionLabel: 'İlleri keşfet', actionTo: '/cities' }}
          onDismiss={() => setDismissListError(true)}
          onRetry={() => { setDismissListError(false); void refetch(); }}
        />
      ) : null}
      {recommendError && !dismissRecommendError && display.length === 0 && !recommendMutation.isPending ? (
        <ErrorAlert
          error={{ ...recommendError, actionLabel: 'Asistana git', actionTo: '/assistant' }}
          onDismiss={() => setDismissRecommendError(true)}
          onRetry={() => { setDismissRecommendError(false); recommendMutation.mutate({ interests: effectiveInterests, durationMinutes: effectiveDuration, budget: effectiveBudget, effectiveCity, routeSource }); }}
        />
      ) : null}
      {noCityRoutes ? (
        <EmptyState
          icon={emptyStates.search.icon}
          title={t('discover.noCityRoutesTitle', { city: effectiveCity }, '{city} için henüz rehber rotası yok')}
          description={t('discover.noCityRoutesDesc', 'AI ile kişisel rota oluşturabilir veya illerden mekanları keşfedebilirsin.')}
          actionLabel={t('discover.noCityRoutesAction', 'Kişisel rota oluştur')}
          actionTo="/discover?ai=1"
        />
      ) : null}
      {isPending && routes.length === 0 ? <ListSkeleton count={6} /> : null}
      {display.length > 0 ? (
        <RouteRecommendationList
          display={display}
          effectiveInterests={effectiveInterests}
          effectiveCity={effectiveCity}
          hasRecommendData={Boolean(recommendMutation.data?.length)}
        />
      ) : null}
      <p className="text-center text-sm text-stone-500">
        <Link className="font-bold text-primary hover:underline" to="/rehberler">Onaylı rehberlerden seç →</Link>
        {' · '}
        <Link className="font-bold text-primary hover:underline" to={`/map?city=${encodeURIComponent(effectiveCity)}`}>
          Haritada {effectiveCity} yerlerini gör →
        </Link>
      </p>
    </section>
  );
}
