import type { FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ListOrdered, Route } from 'lucide-react';

import { RouteBuilder } from '../components/trip/route-builder';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { createTripRequest, type PlannedStop } from '../services/trip-request-service';
import { getRoute } from '../services/route-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';

type RouteMode = 'existing' | 'custom';

export default function TripRequestNewPage(): ReactElement {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const routeIdParam = params.get('routeId');
  const initialRouteId = routeIdParam ? Number(routeIdParam) : null;
  const preferredGuide = (location.state as { preferredGuide?: string } | null)?.preferredGuide;

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const interests = useOnboardingStore((s) => s.interests);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const { data: catalogRoutes = [] } = useRoutesQuery();

  const [routeMode, setRouteMode] = useState<RouteMode>(initialRouteId ? 'existing' : 'custom');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(initialRouteId);
  const [plannedStops, setPlannedStops] = useState<PlannedStop[]>([]);
  const [routeTitle, setRouteTitle] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [groupSize, setGroupSize] = useState(4);
  const [preferredDate, setPreferredDate] = useState('');
  const [budget, setBudget] = useState(600);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialRouteId || !Number.isFinite(initialRouteId)) return;
    getRoute(initialRouteId)
      .then((r) => {
        setRouteTitle(r.title);
        setTitle(t('tripNew.prefillTitle', { title: r.title }, '{title} — rehberli gezi talebi'));
        setMessage(t('tripNew.prefillMessage', { city: r.city }, 'Bu rotayı ({city}) rehber eşliğinde gezmek istiyorum.'));
      })
      .catch(() => undefined);
  }, [initialRouteId, t]);

  useEffect(() => {
    if (preferredGuide && !message) {
      setMessage(t('tripNew.prefillGuide', { name: preferredGuide }, '{name} rehberinden de teklif almak istiyorum.'));
      if (!title) setTitle(t('tripNew.prefillGuideTitle', { name: preferredGuide }, '{name} ile gezi talebi'));
    }
  }, [preferredGuide, message, title, t]);

  if (!accessToken || user?.role === 'guide') {
    return (
      <section className="mx-auto max-w-lg space-y-4">
        <p className="text-sm text-stone-600">{t('tripNew.touristOnly', 'Gezi talebi yalnızca turist hesapları içindir.')}</p>
        <Link className="font-bold text-primary" to="/login">
          {t('common.login', 'Giriş yap')}
        </Link>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (routeMode === 'custom' && plannedStops.length < 2) {
      setError(t('tripNew.minStops', 'Özel rota için en az 2 durak seçin.'));
      return;
    }
    if (routeMode === 'existing' && !selectedRouteId && plannedStops.length < 2) {
      setError(t('tripNew.pickCatalog', 'Katalog rotası seçin veya özel rota oluşturun.'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const stopSummary =
        plannedStops.length > 0
          ? t('tripNew.itineraryPrefix', { stops: plannedStops.map((s) => s.name).join(' →') }, '\n\nGüzergah: {stops}')
          : '';
      await createTripRequest(accessToken, {
        title,
        city: 'Istanbul',
        interests: interests.length ? interests : ['history'],
        route_id: routeMode === 'existing' ? selectedRouteId : null,
        route_mode: routeMode,
        planned_stops: plannedStops,
        group_size: groupSize,
        preferred_date: preferredDate,
        duration_minutes: 120,
        budget,
        preferred_language: preferredLanguage,
        message: message + stopSummary,
      });
      navigate('/talepler');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link className="text-sm font-semibold text-primary" to={initialRouteId ? `/routes/${initialRouteId}` : '/talepler'}>
          ← {t('common.back', 'Geri')}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t('tripNew.title', 'Gezi talebi oluştur')}</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {t('tripNew.subtitle', 'Rotanızı tanımlayın; onaylı rehberler bu plana göre fiyat teklifi gönderir.')}
        </p>
        {groupSize >= 10 ? (
          <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-950 dark:text-amber-100">
            {t('tripNew.groupDiscount', '10+ kişi: rehber tekliflerinde %10 grup indirimi · 20+ kişi: %15')}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className={`tap-scale flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold ${
            routeMode === 'existing' ? 'border-primary bg-primary/10 text-primary' : 'border-stone-300 dark:border-zinc-600'
          }`}
          type="button"
          onClick={() => setRouteMode('existing')}
        >
          <Route className="h-4 w-4" aria-hidden="true" />
          {t('tripNew.catalogRoute', 'Katalog rotası')}
        </button>
        <button
          className={`tap-scale flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold ${
            routeMode === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-stone-300 dark:border-zinc-600'
          }`}
          type="button"
          onClick={() => setRouteMode('custom')}
        >
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
          {t('tripNew.customRoute', 'Kendi rotam')}
        </button>
      </div>

      {routeMode === 'existing' ? (
        <label className="block text-sm font-semibold">
          {t('tripNew.platformRoute', 'Platform rotası')}
          <select
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-[15px]"
            value={selectedRouteId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedRouteId(id || null);
              const r = catalogRoutes.find((x) => x.route_id === id);
              if (r) {
                setRouteTitle(r.title);
                setTitle(`${r.title} — ${t('trips.create', 'Talep oluştur').toLowerCase()}`);
              }
            }}
          >
            <option value="">{t('tripNew.pickRoute', 'Rota seçin…')}</option>
            {catalogRoutes.map((r) => (
              <option key={r.route_id} value={r.route_id}>
                {r.title} · {r.city}
              </option>
            ))}
          </select>
          {routeTitle ? <p className="mt-1 text-xs text-stone-500">{t('tripNew.selected', { title: routeTitle }, 'Seçili: {title}')}</p> : null}
        </label>
      ) : (
        <RouteBuilder stops={plannedStops} onChange={setPlannedStops} />
      )}

      {routeMode === 'existing' ? (
        <p className="text-xs text-stone-500">{t('tripNew.customHint', 'İsterseniz ek duraklar için “Kendi rotam” sekmesine geçin.')}</p>
      ) : null}

      <form className="theme-card space-y-4 rounded-[22px] border p-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold">
          {t('tripNew.titleLabel', 'Başlık')}
          <input
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-[15px]"
            required
            minLength={5}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t('tripNew.dateLabel', 'Tarih')}
          <input
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-[15px]"
            required
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t('tripNew.groupSizeLabel', 'Grup büyüklüğü')}
          <input
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-[15px]"
            min={1}
            max={100}
            required
            type="number"
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t('tripNew.budgetLabel', 'Bütçe hedefi (₺)')}
          <input
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-[15px]"
            min={0}
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t('tripNew.messageLabel', 'Mesajınız')}
          <textarea
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-[15px]"
            required
            minLength={10}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {error ? (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="tap-scale w-full min-h-[48px] rounded-xl bg-primary font-bold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? t('tripNew.submitting', 'Gönderiliyor…') : t('tripNew.submit', 'Talebi yayınla (+40 XP)')}
        </button>
      </form>
    </section>
  );
}
