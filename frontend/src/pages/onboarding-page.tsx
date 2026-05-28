import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { DiscoverLoading } from '../components/loading/discover-loading';
import { ListSkeleton } from '../components/loading/page-skeleton';
import { formatApiError, getApiBaseUrl } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { listCities } from '../services/city-service';
import { updatePreferences } from '../services/profile-service';
import { listRoutes, recommendRoutes } from '../services/route-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import type { RouteResponse } from '../types/route';

const INTERESTS = [
  { id: 'history', label: 'Tarih', icon: '🏛' },
  { id: 'art', label: 'Sanat', icon: '🎨' },
  { id: 'architecture', label: 'Mimari', icon: '🏗' },
  { id: 'gastronomy', label: 'Gastronomi', icon: '🍽' },
  { id: 'hidden', label: 'Gizli Köşeler', icon: '🔍' },
  { id: 'religious', label: 'Dini', icon: '🕌' },
  { id: 'modern', label: 'Modern', icon: '⚡' },
];

const DURATIONS = [
  { value: 60, label: '1 saat' },
  { value: 120, label: '2 saat' },
  { value: 240, label: 'Yarım gün' },
  { value: 480, label: 'Tam gün' },
];

const BUDGETS = [
  { value: 0, label: 'Ücretsiz' },
  { value: 75, label: '₺50–100' },
  { value: 150, label: '₺100+' },
];

const POPULAR_CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Kapadokya', 'Trabzon', 'Gaziantep'];

const TOTAL_STEPS = 5;
const RECOMMEND_TIMEOUT_MS = 10_000;

function filterByCity(routes: RouteResponse[], city: string): RouteResponse[] {
  const norm = city.trim().toLowerCase();
  const matched = routes.filter((r) => r.city.trim().toLowerCase().includes(norm));
  return matched.length > 0 ? matched : routes;
}

function scoreByInterests(routes: RouteResponse[], interestIds: string[]): RouteResponse[] {
  if (interestIds.length === 0) return routes;
  const scored = routes.map((r) => {
    const overlap = r.tags.filter((t) => interestIds.includes(t)).length;
    return { route: r, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  const withMatch = scored.filter((s) => s.score > 0).map((s) => s.route);
  return withMatch.length > 0 ? withMatch : routes;
}

export default function OnboardingPage(): ReactElement {
  const navigate = useNavigate();
  const { setLocale } = useI18n();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const preferredCity = useOnboardingStore((s) => s.preferredCity);
  const interests = useOnboardingStore((s) => s.interests);
  const durationMinutes = useOnboardingStore((s) => s.durationMinutes);
  const budget = useOnboardingStore((s) => s.budget);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const setPreferredCity = useOnboardingStore((s) => s.setPreferredCity);
  const setInterests = useOnboardingStore((s) => s.setInterests);
  const setDurationMinutes = useOnboardingStore((s) => s.setDurationMinutes);
  const setBudget = useOnboardingStore((s) => s.setBudget);
  const setPreferredLanguage = useOnboardingStore((s) => s.setPreferredLanguage);

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recommended, setRecommended] = useState<RouteResponse[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [slowFallback, setSlowFallback] = useState(false);
  const [routeWarning, setRouteWarning] = useState('');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities', 'onboarding'],
    queryFn: listCities,
    staleTime: 300_000,
  });

  const cityOptions = useMemo(() => {
    const names = new Set<string>(POPULAR_CITIES);
    for (const c of cities) {
      if (c.name_tr) names.add(c.name_tr);
    }
    return Array.from(names);
  }, [cities]);

  const progressPct = step <= TOTAL_STEPS ? Math.round((step / (TOTAL_STEPS + 1)) * 100) : 100;

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((x) => x !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const loadRecommendations = async () => {
    setLoadingRoutes(true);
    setSlowFallback(false);
    setRouteWarning('');
    const timer = window.setTimeout(() => setSlowFallback(true), RECOMMEND_TIMEOUT_MS);
    try {
      let routes: RouteResponse[] = [];
      try {
        routes = await recommendRoutes({
          interests,
          duration_minutes: durationMinutes,
          budget,
        });
      } catch {
        routes = await listRoutes();
      }
      const byCity = filterByCity(routes, preferredCity);
      const ranked = scoreByInterests(byCity, interests);
      setRecommended(ranked.slice(0, 3));
      if (ranked.length === 0) {
        setRouteWarning(
          `${preferredCity} için henüz rota yok. Keşfet sayfasından diğer şehirlere bakabilirsin.`,
        );
      }
    } catch (err) {
      setRouteWarning(
        `${formatApiError(err)} Yine de "${preferredCity} Rotalarını Keşfet" ile devam edebilirsin.`,
      );
      setRecommended([]);
    } finally {
      window.clearTimeout(timer);
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    if (step !== 6 || recommended.length > 0 || loadingRoutes) return;
    void loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const completeOnboarding = async (goDiscover: boolean) => {
    setBusy(true);
    setError('');
    const cityQuery = encodeURIComponent(preferredCity);
    const target = goDiscover ? `/discover?city=${cityQuery}` : '/discover';

    if (accessToken && user) {
      try {
        const updated = await updatePreferences(accessToken, {
          interests,
          duration_minutes: durationMinutes,
          budget,
          theme_preference: user.theme_preference ?? 'system',
          preferred_language: preferredLanguage,
          preferred_city: preferredCity,
          onboarding_completed: true,
        });
        setUser(updated);
      } catch {
        setUser({
          ...user,
          interests,
          duration_minutes: durationMinutes,
          budget,
          preferred_language: preferredLanguage,
          preferred_city: preferredCity,
          onboarding_completed: true,
        });
      }
    }

    navigate(target, { replace: true });
    setBusy(false);
  };

  const goNext = () => {
    setError('');
    if (step === 3 && interests.length < 2) {
      setError('En az 2 ilgi alanı seçmelisin.');
      return;
    }
    if (step === 5) {
      setStep(6);
      return;
    }
    setStep(step + 1);
  };

  const cityCta = `${preferredCity} Rotalarını Keşfet`;

  return (
    <section className="mx-auto max-w-lg space-y-6 px-1 py-4" aria-labelledby="onb-title">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-stone-600 dark:text-stone-400">
          <button
            type="button"
            className="tap-scale inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 py-1 hover:bg-stone-900/5 dark:hover:bg-white/5"
            onClick={() => {
              if (step > 1 && step < 6) setStep(step - 1);
              else if (step === 6) setStep(5);
              else navigate(-1);
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step > 1 ? 'Geri' : 'Çık'}
          </button>
          <span>{step <= TOTAL_STEPS ? `${step}/${TOTAL_STEPS}` : 'Sonuç'}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {error && step < 6 ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step === 1 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="onb-title">
              Hangi şehirde gezeceksin?
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Rotalarını bu şehre göre özelleştireceğiz</p>
          </header>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Şehir seçimi">
            {cityOptions.map((name) => (
              <button
                key={name}
                type="button"
                className={`tap-scale min-h-[44px] rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition ${
                  preferredCity === name
                    ? 'border-primary bg-primary/10 text-primary-dark dark:text-primary'
                    : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                }`}
                aria-pressed={preferredCity === name}
                onClick={() => setPreferredCity(name)}
              >
                <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {name}
              </button>
            ))}
          </div>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark"
            type="button"
            onClick={goNext}
          >
            Süreyi seç <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
              Ne kadar zamanın var?
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              <Clock className="mr-1 inline h-4 w-4" aria-hidden="true" />
              {preferredCity} için gezi süren
            </p>
          </header>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Süre">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`tap-scale min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold ${
                  durationMinutes === d.value
                    ? 'bg-primary text-white'
                    : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                }`}
                aria-pressed={durationMinutes === d.value}
                onClick={() => setDurationMinutes(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark"
            type="button"
            onClick={goNext}
          >
            İlgi alanlarını seç <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
              İlgi alanın ne?
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">En az 2 seç · AI önerilerin buna göre şekillenir</p>
          </header>
          <div className="flex flex-wrap gap-2" role="group" aria-label="İlgi alanları">
            {INTERESTS.map((item) => {
              const active = interests.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`tap-scale min-h-[44px] rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'border-primary bg-primary/10 text-primary-dark dark:text-primary'
                      : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                  }`}
                  aria-pressed={active}
                  onClick={() => toggleInterest(item.id)}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-stone-500">Seçilen: {interests.length}</p>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-50"
            type="button"
            disabled={interests.length < 2}
            onClick={goNext}
          >
            Bütçeni belirle <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
              Bütçen nedir?
            </h1>
          </header>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Bütçe">
            {BUDGETS.map((b) => (
              <button
                key={b.value}
                type="button"
                className={`tap-scale min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold ${
                  budget === b.value
                    ? 'bg-primary text-white'
                    : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                }`}
                aria-pressed={budget === b.value}
                onClick={() => setBudget(b.value)}
              >
                {b.label}
              </button>
            ))}
          </div>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark"
            type="button"
            onClick={goNext}
          >
            Dil tercihini seç <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
              Dil tercihin nedir?
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Sesli rehber ve arayüz dili</p>
          </header>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Dil">
            {(
              [
                { id: 'tr' as const, label: 'Türkçe' },
                { id: 'en' as const, label: 'English' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={`tap-scale min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold ${
                  preferredLanguage === lang.id
                    ? 'bg-primary text-white'
                    : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                }`}
                aria-pressed={preferredLanguage === lang.id}
                onClick={() => {
                  setPreferredLanguage(lang.id);
                  if (lang.id === 'tr' || lang.id === 'en') setLocale(lang.id);
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60"
            type="button"
            disabled={loadingRoutes}
            onClick={goNext}
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Kişisel rotalarımı hazırla
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-5 animate-fade-in-up">
          {loadingRoutes ? (
            <div className="space-y-4">
              <DiscoverLoading />
              <ListSkeleton count={3} />
              {slowFallback ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
                  Öneriler biraz uzun sürdü. Hazır olunca burada göreceksin; istersen keşfe de geçebilirsin.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {routeWarning ? (
                <div
                  className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
                  role="status"
                >
                  <p>{routeWarning}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="font-bold text-primary underline"
                      onClick={() => void loadRecommendations()}
                    >
                      Tekrar dene
                    </button>
                    <button
                      type="button"
                      className="font-bold text-stone-700 underline dark:text-stone-300"
                      onClick={() => setRouteWarning('')}
                    >
                      Kapat
                    </button>
                  </div>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/80">API: {getApiBaseUrl()}</p>
                </div>
              ) : null}
              <header className="text-center">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
                  {recommended.length > 0
                    ? `Sana en uygun ${recommended.length} rota hazırlandı`
                    : 'Tercihlerin kaydedildi'}
                </h1>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                  {preferredCity} · {interests.length} ilgi alanı · {durationMinutes} dk
                </p>
              </header>
              <ul className="space-y-3">
                {recommended.map((route) => (
                  <li key={route.route_id}>
                    <Link
                      to={`/routes/${route.route_id}`}
                      className="tap-scale block rounded-2xl border border-stone-900/10 bg-white p-4 shadow-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-zinc-900"
                    >
                      <p className="font-bold text-heritage-ink dark:text-stone-50">{route.title}</p>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                        {route.city} · {route.estimated_minutes} dk · ₺{route.price}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              {recommended.length === 0 && !routeWarning ? (
                <p className="text-center text-sm text-stone-600 dark:text-stone-400">
                  Bu şehir için henüz özel eşleşme yok; keşifte tüm rotalara bakabilirsin.
                </p>
              ) : null}
              <button
                className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60"
                type="button"
                disabled={busy}
                onClick={() => void completeOnboarding(true)}
              >
                {busy ? 'Kaydediliyor…' : cityCta}
              </button>
              <button
                className="tap-scale w-full min-h-[44px] text-sm font-semibold text-primary underline-offset-4 hover:underline"
                type="button"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                Tercihlerimi düzenle
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
