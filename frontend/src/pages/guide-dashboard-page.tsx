import { Banknote, ShoppingCart, TrendingUp } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { GuideRoutesPanel } from '../components/guide/guide-routes-panel';
import { MiniBarChart } from '../components/ui/mini-bar-chart';
import { StatCard } from '../components/ui/stat-card';
import { ButtonLink } from '../components/ui/button';
import { BackButton } from '../components/ui/back-button';
import { formatApiError } from '../lib/api';
import {
  fetchMyGuideAnalytics,
  fetchMyGuideEarnings,
  requestGuidePayout,
  type GuideAnalyticsResponse,
} from '../services/guide-service';
import { useAuthStore } from '../stores/auth-store';

export default function GuideDashboardPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [earnings, setEarnings] = useState<{ monthly_earnings: number; route_sales: number } | null>(null);
  const [analytics, setAnalytics] = useState<GuideAnalyticsResponse | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role !== 'guide' || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const [earn, stats] = await Promise.all([
          fetchMyGuideEarnings(accessToken),
          fetchMyGuideAnalytics(accessToken),
        ]);
        if (!cancelled) {
          setEarnings({ monthly_earnings: earn.monthly_earnings, route_sales: earn.route_sales });
          setAnalytics(stats);
        }
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, accessToken]);

  const chartData = useMemo(() => {
    if (analytics?.top_routes?.length) {
      return analytics.top_routes.slice(0, 5).map((r) => ({
        label: r.title.length > 12 ? `${r.title.slice(0, 11)}…` : r.title,
        value: r.guide_net,
      }));
    }
    if (!earnings) return [];
    const m = earnings.monthly_earnings;
    return [
      { label: '1. hafta', value: m * 0.18 },
      { label: '2. hafta', value: m * 0.22 },
      { label: '3. hafta', value: m * 0.28 },
      { label: '4. hafta', value: m * 0.32 },
    ];
  }, [analytics, earnings]);

  const handlePayout = async () => {
    if (!user || !earnings || earnings.monthly_earnings < 100) {
      setError('Minimum ödeme talebi ₺100 olmalıdır.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await requestGuidePayout({ guide_id: user.user_id, amount: earnings.monthly_earnings });
      if (result.status === 'rejected') setError(result.message);
      else setSuccess(result.message);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (user?.role !== 'guide') {
    return (
      <section className="mx-auto max-w-lg space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Rehber paneli</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Bu alan yalnızca rehber rolü içindir.</p>
        </header>
        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95">
          <p className="text-sm">Rehber olarak kayıt ol ve rotalarını sat.</p>
          <ButtonLink className="mt-4" to="/register">
            Rehber kaydı
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6" aria-labelledby="gd-title">
      <BackButton />
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="gd-title">
          Gelir paneli
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">%15 platform · %85 rehber payı</p>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Bu ay net"
          value={earnings ? `₺${earnings.monthly_earnings.toFixed(2)}` : '—'}
          hint="Onaylı satışlardan"
          accent="primary"
        />
        <StatCard
          icon={ShoppingCart}
          label="Satış adedi"
          value={analytics ? analytics.route_sales : earnings ? earnings.route_sales : '—'}
          hint={`${analytics?.route_count ?? 0} aktif rota`}
          accent="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Brüt gelir"
          value={analytics ? `₺${analytics.gross_revenue.toFixed(2)}` : '—'}
          hint="Platform öncesi"
          accent="primary"
        />
        <StatCard
          icon={ShoppingCart}
          label="Teklifler"
          value={analytics ? `${analytics.accepted_offers} / ${analytics.pending_offers}` : '—'}
          hint="Kabul / bekleyen"
          accent="amber"
        />
      </div>

      <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold">
            {analytics?.top_routes?.length ? 'Rota bazlı net gelir' : 'Aylık gelir grafiği'}
          </h2>
        </div>
        {chartData.length ? (
          <MiniBarChart data={chartData} />
        ) : (
          <p className="text-sm text-stone-500">Henüz satış verisi yok.</p>
        )}
        {analytics?.top_routes?.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {analytics.top_routes.map((r) => (
              <li key={r.route_id} className="flex justify-between border-t border-stone-900/10 pt-2 dark:border-white/10">
                <span className="font-semibold">{r.title}</span>
                <span className="text-primary">
                  {r.sales_count} satış · ₺{r.guide_net.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <GuideRoutesPanel />

      <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95">
        <p className="font-semibold">Ödeme talebi</p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Bekleyen bakiye: ₺{earnings?.monthly_earnings.toFixed(2) ?? '0.00'} · Min. ₺100
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="tap-scale inline-flex min-h-[48px] items-center rounded-xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-50"
            type="button"
            disabled={busy || !earnings || earnings.monthly_earnings < 100}
            onClick={handlePayout}
          >
            {busy ? 'Gönderiliyor…' : 'Ödeme talep et'}
          </button>
          <Link className="tap-scale inline-flex min-h-[48px] items-center rounded-xl border-2 border-stone-300 px-5 font-semibold dark:border-zinc-600" to="/talepler">
            Açık talepler
          </Link>
          <Link className="tap-scale inline-flex min-h-[48px] items-center rounded-xl border-2 border-stone-300 px-5 font-semibold dark:border-zinc-600" to="/guide/dogrulama">
            Doğrulama
          </Link>
        </div>
      </div>
    </section>
  );
}
