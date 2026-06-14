import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { BackButton } from '../components/ui/back-button';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { createPlan, deletePlan, listPlans, updatePlan } from '../services/plan-service';
import { listRoutes } from '../services/route-service';
import { useAuthStore } from '../stores/auth-store';
import type { PlanResponse } from '../types/plan';
import type { RouteResponse } from '../types/route';

const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDateLabel(iso: string, locale: 'tr' | 'en'): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildCalendarDays(viewDate: Date): (string | null)[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startOffset }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function PlannerPage(): ReactElement {
  const { t, locale } = useI18n();
  const weekdays = locale === 'en' ? WEEKDAYS_EN : WEEKDAYS_TR;
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { routeId?: number; title?: string } | null;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState(routeState?.title ?? '');
  const [routeId, setRouteId] = useState<string>(routeState?.routeId ? String(routeState.routeId) : '');
  const [plannedTime, setPlannedTime] = useState('10:00');
  const [duration, setDuration] = useState(120);
  const [memo, setMemo] = useState('');

  const month = monthKey(viewDate);
  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const plansByDate = useMemo(() => {
    const map = new Map<string, PlanResponse[]>();
    for (const p of plans) {
      const list = map.get(p.planned_date) ?? [];
      list.push(p);
      map.set(p.planned_date, list);
    }
    return map;
  }, [plans]);
  const selectedPlans = plansByDate.get(selectedDate) ?? [];

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const [p, r] = await Promise.all([listPlans(accessToken, month), listRoutes()]);
      setPlans(p);
      setRoutes(r);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, month]);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login', { state: { from: '/planner' } });
      return;
    }
    void load();
  }, [accessToken, load, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !title.trim()) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await createPlan(accessToken, {
        title: title.trim(),
        route_id: routeId ? Number(routeId) : null,
        planned_date: selectedDate,
        planned_time: plannedTime,
        duration_minutes: duration,
        memo: memo.trim(),
      });
      setTitle('');
      setRouteId('');
      setMemo('');
      setSuccess(t('planner.planAdded', 'Plan takvime eklendi.'));
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (plan: PlanResponse, status: PlanResponse['status']) => {
    if (!accessToken) return;
    setBusy(true);
    try {
      await updatePlan(accessToken, plan.plan_id, { status });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!accessToken) return;
    setBusy(true);
    try {
      await deletePlan(accessToken, planId);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const monthLabel = viewDate.toLocaleDateString(locale === 'en' ? 'en-GB' : 'tr-TR', { month: 'long', year: 'numeric' });

  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="planner-title">
      <BackButton />
      <header>
        <h1
          className="inline-flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50"
          id="planner-title"
        >
          <CalendarDays className="h-8 w-8 text-primary" aria-hidden="true" />
          {t('planner.title', 'Rota Planlayıcı')}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {t('planner.subtitle', 'Gezilerinizi takvime ekleyin, tarih ve saat belirleyin.')}
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary" role="status">
          {success}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
          <div className="mb-4 flex items-center justify-between">
            <button
              className="tap-scale focus-ring inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-900/10 dark:border-white/10"
              type="button"
              aria-label={t('planner.prevMonth', 'Önceki ay')}
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="font-display text-lg font-bold capitalize">{monthLabel}</p>
            <button
              className="tap-scale focus-ring inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-900/10 dark:border-white/10"
              type="button"
              aria-label={t('planner.nextMonth', 'Sonraki ay')}
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-500">
            {weekdays.map((d) => (
              <div className="py-2" key={d}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1" aria-busy={loading}>
            {calendarDays.map((iso, idx) => {
              if (!iso) return <div className="min-h-[52px]" key={`empty-${idx}`} />;
              const dayPlans = plansByDate.get(iso) ?? [];
              const isSelected = iso === selectedDate;
              const dayNum = Number(iso.split('-')[2]);
              return (
                <button
                  className={[
                    'tap-scale focus-ring min-h-[52px] rounded-xl border p-1 text-left transition',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-stone-900/10 hover:border-primary/40 dark:border-white/10',
                  ].join(' ')}
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                >
                  <span className="text-sm font-bold">{dayNum}</span>
                  {dayPlans.length ? (
                    <span className="mt-1 block truncate rounded-md bg-amber-500/25 px-1 text-[10px] font-semibold text-amber-900 dark:text-amber-200">
                      {t('planner.planCount', { count: dayPlans.length }, '{count} plan')}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <form
            className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95"
            onSubmit={handleCreate}
          >
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold">
              <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
              {t('planner.newPlan', { date: formatDateLabel(selectedDate, locale) }, 'Yeni plan · {date}')}
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">
                {t('planner.titleLabel', 'Başlık')}
                <input
                  className="mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('planner.titlePlaceholder', 'Örn. Sultanahmet sabah turu')}
                />
              </label>
              <label className="block text-sm font-semibold">
                {t('planner.routeOptional', 'Rota (opsiyonel)')}
                <select
                  className="mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                >
                  <option value="">{t('planner.customPlan', 'Özel plan')}</option>
                  {routes.map((r) => (
                    <option key={r.route_id} value={r.route_id}>
                      {r.title} · {r.estimated_minutes} {t('common.minutes', 'dk')}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold">
                  {t('planner.timeLabel', 'Saat')}
                  <input
                    className="mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
                    type="time"
                    value={plannedTime}
                    onChange={(e) => setPlannedTime(e.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  {t('planner.durationLabel', 'Süre (dk)')}
                  <input
                    className="mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
                    type="number"
                    min={15}
                    max={720}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                {t('planner.memoLabel', 'Plan notu')}
                <textarea
                  className="mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
                  rows={2}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder={t('planner.memoPlaceholder', 'Buluşma noktası, hatırlatmalar…')}
                />
              </label>
            </div>
            <Button className="mt-4 w-full" disabled={busy} type="submit">
              {busy ? t('common.saving', 'Kaydediliyor…') : t('planner.addToCalendar', 'Takvime ekle')}
            </Button>
          </form>

          <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
            <h2 className="font-display text-lg font-bold">{t('planner.selectedDay', { count: selectedPlans.length }, 'Seçili gün ({count})')}</h2>
            {selectedPlans.length === 0 ? (
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t('planner.noPlansDay', 'Bu gün için plan yok.')}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {selectedPlans.map((plan) => (
                  <li
                    className="rounded-xl border border-stone-900/10 p-3 dark:border-white/10"
                    key={plan.plan_id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{plan.title}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-stone-500">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {plan.planned_time} · {plan.duration_minutes} {t('common.minutes', 'dk')}
                        </p>
                        {plan.memo ? <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{plan.memo}</p> : null}
                        {plan.route_id ? (
                          <Link
                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                            to={`/routes/${plan.route_id}`}
                          >
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                            {t('planner.viewRoute', 'Rotayı gör')}
                          </Link>
                        ) : null}
                      </div>
                      <button
                        className="tap-scale text-red-600"
                        type="button"
                        aria-label={t('planner.deletePlan', 'Planı sil')}
                        disabled={busy}
                        onClick={() => handleDelete(plan.plan_id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['planned', 'completed', 'cancelled'] as const).map((s) => (
                        <button
                          className={[
                            'rounded-full px-2.5 py-1 text-xs font-bold',
                            plan.status === s ? 'bg-primary text-white' : 'border border-stone-900/15 dark:border-white/15',
                          ].join(' ')}
                          key={s}
                          type="button"
                          disabled={busy}
                          onClick={() => handleStatus(plan, s)}
                        >
                          {s === 'planned' ? t('planner.statusPlanned', 'Planlandı') : s === 'completed' ? t('planner.statusCompleted', 'Tamamlandı') : t('planner.statusCancelled', 'İptal')}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
