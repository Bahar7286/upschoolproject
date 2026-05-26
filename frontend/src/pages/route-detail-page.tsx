import { Download, Headphones, CalendarPlus, MapPin, MessageSquarePlus, Play, ShoppingCart } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { fetchNarrationAudio } from '../services/ai-service';
import { langToSpeechCode, playAudioBase64, useSpeechSynthesis } from '../hooks/use-speech';
import { formatApiError } from '../lib/api';
import { saveOfflineRoutePackage } from '../lib/offline-package';
import { listPurchasesByUser } from '../services/purchase-service';
import { getRoute } from '../services/route-service';
import { listStops } from '../services/stop-service';
import { fetchCurrentUser } from '../services/auth-service';
import { useActiveRouteStore } from '../stores/active-route-store';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import { RouteNotesPanel, RouteReviewsPanel } from '../components/routes/route-social-panels';
import type { RouteResponse } from '../types/route';
import type { StopResponse } from '../types/stop';

export default function RouteDetailPage(): ReactElement {
  const { routeId } = useParams();
  const id = Number(routeId);
  const navigate = useNavigate();

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const setActiveRoute = useActiveRouteStore((s) => s.setActiveRoute);

  const { speak, speaking, stop: stopSpeech } = useSpeechSynthesis();

  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [stops, setStops] = useState<StopResponse[]>([]);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [audioBusy, setAudioBusy] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Geçersiz rota.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [r, s] = await Promise.all([getRoute(id), listStops(id, accessToken)]);
        if (!cancelled) {
          setRoute(r);
          setStops(s);
        }
        if (!cancelled && accessToken && user) {
          const purchases = await listPurchasesByUser(user.user_id, accessToken);
          setOwned(purchases.some((p) => p.route_id === id && p.status === 'confirmed'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, accessToken, user]);

  const handlePurchase = () => {
    if (!accessToken || !user || !route) {
      navigate('/login', { state: { from: `/routes/${id}` } });
      return;
    }
    navigate('/odeme', {
      state: {
        kind: 'route',
        amount: route.price,
        title: route.title,
        routeId: route.route_id,
      },
    });
  };

  const handleStartRoute = () => {
    if (!route) return;
    setActiveRoute(route.route_id, route.title, stops);
    navigate(`/map?route=${route.route_id}&active=1`);
  };

  const handleListen = async (stop: StopResponse) => {
    if (speaking) {
      stopSpeech();
      return;
    }
    setAudioBusy(true);
    try {
      const lang = preferredLanguage;
      const res = await fetchNarrationAudio({
        stop_title: stop.title,
        description: stop.description || '',
        language: lang,
      });
      if (res.audio_base64) {
        await playAudioBase64(res.audio_base64);
      } else {
        speak(res.script || stop.description || stop.title, langToSpeechCode(lang));
      }
    } catch {
      const text = stop.description || stop.title;
      speak(text, langToSpeechCode(preferredLanguage));
    } finally {
      setAudioBusy(false);
    }
  };

  const handleOfflineDownload = () => {
    if (!route || !stops.length) return;
    saveOfflineRoutePackage({
      routeId: route.route_id,
      routeTitle: route.title,
      stops,
      city: route.city,
      savedAt: new Date().toISOString(),
    });
    setSuccess('Offline paket cihazınıza kaydedildi. Ses sayfasından çevrimdışı kullanabilirsiniz.');
  };

  if (loading) {
    return (
      <section className="space-y-4" aria-busy="true" aria-label="Rota yükleniyor">
        <div className="h-48 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-4 animate-pulse rounded bg-stone-200 dark:bg-zinc-800" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200 dark:bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (error && !route) {
    return (
      <section className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
        <Link className="tap-scale inline-flex min-h-[44px] items-center rounded-xl border-2 border-stone-300 px-4 font-semibold" to="/discover">
          Keşfe dön
        </Link>
      </section>
    );
  }

  if (!route) return <section />;

  return (
    <section className="space-y-6">
      <nav
        className="flex min-w-0 items-center gap-1 text-sm text-stone-600 dark:text-stone-400"
        aria-label="Sayfa konumu"
      >
        <Link className="shrink-0 font-semibold hover:underline" to="/discover">
          Keşfet
        </Link>
        <span aria-hidden="true" className="shrink-0">
          /
        </span>
        <span className="min-w-0 truncate">{route.title}</span>
      </nav>

      <header className="route-page-header overflow-hidden rounded-[22px] p-4 shadow-lift sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{route.city}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{route.title}</h1>
        <p className="route-card-muted mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm">
          <span>{route.estimated_minutes} dakika</span>
          <span aria-hidden="true">·</span>
          <span>₺{route.price.toFixed(2)}</span>
          <span aria-hidden="true">·</span>
          <span>Rehber #{route.guide_id}</span>
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          {owned ? (
            <button
              className="tap-scale responsive-btn rounded-xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark"
              type="button"
              onClick={handleStartRoute}
            >
              <MapPin className="h-5 w-5" aria-hidden="true" />
              Rotayı Başlat
            </button>
          ) : (
            <button
              className="tap-scale responsive-btn rounded-xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60"
              type="button"
              disabled={busy}
              onClick={handlePurchase}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {busy ? 'İşleniyor…' : `Satın Al · ₺${route.price.toFixed(2)}`}
            </button>
          )}
          <Link
            className="tap-scale responsive-btn rounded-xl border-2 border-white/40 px-5 font-semibold text-white hover:bg-white/10"
            to={`/map?route=${route.route_id}`}
          >
            Haritada gör
          </Link>
          {accessToken && user?.role !== 'guide' ? (
            <Link
              className="tap-scale responsive-btn rounded-xl border-2 border-amber-300/80 bg-amber-500/20 px-5 font-semibold text-white hover:bg-amber-500/30"
              to={`/talepler/yeni?routeId=${route.route_id}`}
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
              Rehberlerden teklif al
            </Link>
          ) : null}
          {accessToken ? (
            <Link
              className="tap-scale responsive-btn rounded-xl border-2 border-white/40 px-5 font-semibold text-white hover:bg-white/10"
              to="/planner"
              state={{ routeId: route.route_id, title: route.title }}
            >
              <CalendarPlus className="h-5 w-5" aria-hidden="true" />
              Plana ekle
            </Link>
          ) : null}
          {owned ? (
            <>
              <Link
                className="tap-scale responsive-btn rounded-xl border-2 border-white/40 px-5 font-semibold text-white hover:bg-white/10"
                to="/audio"
              >
                <Headphones className="h-5 w-5" aria-hidden="true" />
                Sesli rehber
              </Link>
              <button
                className="tap-scale responsive-btn rounded-xl border-2 border-amber-300/80 bg-amber-500/20 px-5 font-semibold text-white hover:bg-amber-500/30"
                type="button"
                onClick={handleOfflineDownload}
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                Offline indir
              </button>
            </>
          ) : null}
        </div>
      </header>

      {success ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary" role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="stops-title">
        <h2 className="font-display text-xl font-bold text-heritage-ink dark:text-stone-50" id="stops-title">
          Duraklar ({stops.length})
        </h2>
        <ol className="mt-4 space-y-4">
          {stops.map((stop, index) => {
            const locked = !owned && index >= 2;
            return (
              <li
                className={`relative rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95 ${locked ? 'opacity-60' : ''}`}
                key={stop.stop_id}
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-bold text-amber-800 dark:text-amber-200">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="font-bold text-heritage-ink dark:text-stone-50">{stop.title}</h3>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {locked ? 'Satın alarak tüm durakları açın.' : stop.description || 'Anlatım metni yakında.'}
                    </p>
                    {!locked ? (
                      <p className="text-xs text-stone-500">
                        {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
                      </p>
                    ) : null}
                    {!locked ? (
                      <button
                        className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-900/15 px-3 text-sm font-semibold hover:border-primary dark:border-white/15"
                        type="button"
                        onClick={() => void handleListen(stop)}
                        disabled={audioBusy}
                      >
                        <Play className="h-4 w-4" aria-hidden="true" />
                        {audioBusy ? 'Ses üretiliyor…' : speaking ? 'Durdur' : 'Sesli anlatım'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {stops.length === 0 ? <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">Bu rota için durak kaydı yok.</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RouteNotesPanel routeId={route.route_id} />
        <RouteReviewsPanel routeId={route.route_id} />
      </div>
    </section>
  );
}
