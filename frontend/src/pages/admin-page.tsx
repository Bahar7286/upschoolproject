import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, X } from 'lucide-react';

import { formatApiError } from '../lib/api';
import {
  documentUrl,
  listOpenReports,
  listPendingGuides,
  listPendingRoutes,
  moderateGuide,
  moderateRoute,
  resolveReport,
  setUserPremium,
  syncPoi,
  type AdminPendingGuide,
  type AdminPendingRoute,
  type ContentReportItem,
} from '../services/admin-service';
import { useAuthStore } from '../stores/auth-store';

type Tab = 'guides' | 'routes' | 'reports' | 'tools';

export default function AdminPage(): ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('guides');
  const [pending, setPending] = useState<AdminPendingGuide[]>([]);
  const [pendingRoutes, setPendingRoutes] = useState<AdminPendingRoute[]>([]);
  const [reports, setReports] = useState<ContentReportItem[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [poiCityId, setPoiCityId] = useState('34');
  const [premiumUserId, setPremiumUserId] = useState('');
  const [toolMsg, setToolMsg] = useState('');

  const load = async () => {
    if (!accessToken) return;
    try {
      const [g, r, rep] = await Promise.all([
        listPendingGuides(accessToken),
        listPendingRoutes(accessToken),
        listOpenReports(accessToken),
      ]);
      setPending(g);
      setPendingRoutes(r);
      setReports(rep);
      setError('');
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  if (user?.role !== 'admin') {
    return (
      <section className="mx-auto max-w-lg space-y-4">
        <h1 className="font-display text-2xl font-bold">Yönetim paneli</h1>
        <p className="text-sm text-stone-600">Bu sayfa yalnızca platform yöneticileri içindir.</p>
        <p className="text-xs text-stone-500">Demo: admin@example.com / demo123</p>
        <Link className="font-bold text-primary" to="/login">
          Giriş
        </Link>
      </section>
    );
  }

  const handleGuideAction = async (guideId: number, action: 'verify' | 'reject') => {
    if (!accessToken) return;
    const reason =
      action === 'reject'
        ? window.prompt('Red gerekçesi (isteğe bağlı):', 'Belgeler eksik veya okunamıyor') ?? ''
        : '';
    setBusyId(guideId);
    try {
      await moderateGuide(accessToken, guideId, action, reason);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRouteAction = async (routeId: number, action: 'approve' | 'reject' | 'unpublish') => {
    if (!accessToken) return;
    const feedback =
      action !== 'approve'
        ? window.prompt('Geri bildirim (rehbere gösterilir):', '') ?? ''
        : '';
    setBusyId(routeId);
    try {
      await moderateRoute(accessToken, routeId, action, feedback);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'guides', label: 'Rehberler' },
    { id: 'routes', label: 'Rota inceleme' },
    { id: 'reports', label: 'Bildirimler' },
    { id: 'tools', label: 'Araçlar' },
  ];

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Yönetim paneli</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Rehber doğrulama, rota moderasyonu ve içerik bildirimleri.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Admin sekmeleri">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              tab === t.id ? 'bg-primary text-white' : 'bg-stone-200 dark:bg-zinc-800'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      {tab === 'guides' ? (
        pending.length === 0 ? (
          <p className="rounded-[22px] border border-dashed px-4 py-10 text-center text-sm text-stone-500">
            Bekleyen rehber başvurusu yok.
          </p>
        ) : (
          <ul className="space-y-4">
            {pending.map((g) => (
              <li
                key={g.guide_id}
                className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h2 className="font-bold">{g.full_name}</h2>
                    <p className="text-xs text-stone-500">{g.email}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold">{g.verification_status}</span>
                </div>
                <p className="mt-2 text-sm">
                  {g.license_number} · {g.university}
                </p>
                {g.document_path ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                    href={documentUrl(g.document_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Belgeyi aç
                  </a>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                    disabled={busyId === g.guide_id}
                    onClick={() => void handleGuideAction(g.guide_id, 'verify')}
                  >
                    <Check className="h-4 w-4" />
                    Onayla
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-heritage-ember px-4 text-sm font-bold text-heritage-ember disabled:opacity-60"
                    disabled={busyId === g.guide_id}
                    onClick={() => void handleGuideAction(g.guide_id, 'reject')}
                  >
                    <X className="h-4 w-4" />
                    Reddet
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'routes' ? (
        pendingRoutes.length === 0 ? (
          <p className="rounded-[22px] border border-dashed px-4 py-10 text-center text-sm text-stone-500">
            İncelemede rota yok.
          </p>
        ) : (
          <ul className="space-y-4">
            {pendingRoutes.map((r) => (
              <li key={r.route_id} className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
                <h2 className="font-bold">{r.title}</h2>
                <p className="text-sm text-stone-500">
                  {r.city} · {r.estimated_minutes} dk · ₺{r.price.toFixed(2)} · Rehber #{r.guide_id}
                </p>
                <Link className="text-sm font-semibold text-primary" to={`/routes/${r.route_id}`}>
                  Rotayı önizle →
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    disabled={busyId === r.route_id}
                    onClick={() => void handleRouteAction(r.route_id, 'approve')}
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border-2 border-amber-600 px-4 py-2 text-sm font-bold text-amber-700 disabled:opacity-60"
                    disabled={busyId === r.route_id}
                    onClick={() => void handleRouteAction(r.route_id, 'reject')}
                  >
                    Değişiklik iste
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border-2 border-stone-400 px-4 py-2 text-sm font-bold disabled:opacity-60"
                    disabled={busyId === r.route_id}
                    onClick={() => void handleRouteAction(r.route_id, 'unpublish')}
                  >
                    Yayından kaldır
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'reports' ? (
        reports.length === 0 ? (
          <p className="rounded-[22px] border border-dashed px-4 py-10 text-center text-sm text-stone-500">
            Açık bildirim yok.
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((rep) => (
              <li key={rep.report_id} className="rounded-xl border border-stone-900/10 p-4 dark:border-white/10">
                <p className="font-bold">
                  {rep.entity_type} #{rep.entity_id} — {rep.reason}
                </p>
                <p className="mt-1 text-sm text-stone-600">{rep.details || '—'}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="text-sm font-bold text-primary"
                    onClick={() => {
                      if (!accessToken) return;
                      void resolveReport(accessToken, rep.report_id, 'reviewed').then(load);
                    }}
                  >
                    İncelendi
                  </button>
                  <button
                    type="button"
                    className="text-sm font-bold text-stone-500"
                    onClick={() => {
                      if (!accessToken) return;
                      void resolveReport(accessToken, rep.report_id, 'dismissed').then(load);
                    }}
                  >
                    Reddet
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'tools' ? (
        <div className="space-y-6 rounded-[22px] border border-stone-900/10 p-5 dark:border-white/10">
          {toolMsg ? <p className="text-sm font-semibold text-primary">{toolMsg}</p> : null}
          <div>
            <h2 className="font-bold">POI senkron (OSM)</h2>
            <label className="mt-2 block text-sm">
              city_id
              <input
                className="theme-input mt-1 w-full rounded-xl border px-3 py-2"
                value={poiCityId}
                onChange={(e) => setPoiCityId(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              onClick={() => {
                if (!accessToken) return;
                void syncPoi(accessToken, { city_id: Number(poiCityId) })
                  .then((r) => setToolMsg(`POI: ${r.created} yeni, ${r.fetched} çekildi`))
                  .catch((e) => setError(formatApiError(e)));
              }}
            >
              Senkronize et
            </button>
          </div>
          <div>
            <h2 className="font-bold">Premium kullanıcı</h2>
            <input
              className="theme-input mt-2 w-full rounded-xl border px-3 py-2"
              placeholder="user_id"
              value={premiumUserId}
              onChange={(e) => setPremiumUserId(e.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-sm font-bold"
                onClick={() => {
                  if (!accessToken || !premiumUserId) return;
                  void setUserPremium(accessToken, Number(premiumUserId), true).then(() =>
                    setToolMsg('Premium açıldı'),
                  );
                }}
              >
                Premium ver
              </button>
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-sm font-bold"
                onClick={() => {
                  if (!accessToken || !premiumUserId) return;
                  void setUserPremium(accessToken, Number(premiumUserId), false).then(() =>
                    setToolMsg('Premium kapatıldı'),
                  );
                }}
              >
                Premium kaldır
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
