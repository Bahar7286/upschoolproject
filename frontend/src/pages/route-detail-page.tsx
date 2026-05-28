import { Download, Headphones, CalendarPlus, MapPin, MessageSquarePlus, Play, ShoppingCart } from 'lucide-react';
import type { ReactElement } from 'react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { fetchNarrationAudio } from '../services/ai-service';
import { langToSpeechCode, playAudioBase64, useSpeechSynthesis } from '../hooks/use-speech';
import { RouteRecommendNps } from '../components/feedback/route-recommend-nps';
import { PageSkeleton } from '../components/loading/page-skeleton';
import { ErrorAlert } from '../components/ui/error-alert';
import { mapError } from '../lib/user-errors';
import { saveOfflineRoutePackage } from '../lib/offline-package';
import { listPurchasesByUser } from '../services/purchase-service';
import { getRoute } from '../services/route-service';
import { listStops } from '../services/stop-service';
import { listTripExtraStops } from '../services/trip-extra-stop-service';
import { fetchCurrentUser } from '../services/auth-service';
import { useActiveRouteStore } from '../stores/active-route-store';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import { VerifiedGuideBadge } from '../components/guide/verified-guide-badge';
import { RouteQualityPanel } from '../components/routes/route-quality-panel';
import { RouteNotesPanel, RouteReviewsPanel } from '../components/routes/route-social-panels';
import { Breadcrumbs } from '../components/ui/breadcrumbs';
import { ContentReportForm } from '../components/routes/content-report-form';
import { JsonLd } from '../components/seo/json-ld';
import { PageMeta } from '../components/seo/page-meta';
import { getGuidePublicProfile, type GuideProfile } from '../services/guide-profile-service';
import { fetchPaymentConfig } from '../services/payment-checkout-service';
import { getRouteReviewSummary } from '../services/social-service';
import type { RouteResponse } from '../types/route';
import type { StopResponse } from '../types/stop';
import type { GooglePlaceSummary } from '../types/google';

const LeafletRegionMap = lazy(() =>
  import('../features/map/leaflet-region-map').then((m) => ({ default: m.LeafletRegionMap })),
);

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
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentConfig()
      .then((c) => setStripeEnabled(c.stripe_enabled))
      .catch(() => setStripeEnabled(false));
  }, []);

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
        const [r, s, summary] = await Promise.all([
          getRoute(id),
          listStops(id, accessToken),
          getRouteReviewSummary(id).catch(() => null),
        ]);
        if (!cancelled) {
          setRoute(r);
          setStops(s);
          setAvgRating(summary && summary.review_count > 0 ? summary.average_rating : null);
        }
        if (!cancelled && r.guide_id) {
          getGuidePublicProfile(r.guide_id)
            .then((g) => {
              if (!cancelled) setGuide(g);
            })
            .catch(() => {
              if (!cancelled) setGuide(null);
            });
        }
        if (!cancelled && accessToken && user) {
          const purchases = await listPurchasesByUser(user.user_id, accessToken);
          setOwned(purchases.some((p) => p.route_id === id && p.status === 'confirmed'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(mapError(err, 'route-detail').message);
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

  const handleStartRoute = async () => {
    if (!route) return;
    let extras: Awaited<ReturnType<typeof listTripExtraStops>> = [];
    if (accessToken) {
      try {
        extras = await listTripExtraStops(route.route_id, accessToken);
      } catch {
        extras = [];
      }
    }
    setActiveRoute(route.route_id, route.title, stops, extras);
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
    return <PageSkeleton />;
  }

  if (error && !route) {
    return (
      <section className="space-y-4">
        <ErrorAlert
          error={{
            kind: 'api',
            message: error,
            actionLabel: 'Keşfe dön',
            actionTo: '/discover',
          }}
        />
        <Link className="tap-scale inline-flex min-h-[44px] items-center rounded-xl border-2 border-stone-300 px-4 font-semibold" to="/discover">
          Keşfe dön
        </Link>
      </section>
    );
  }

  if (!route) return <section />;

  const mapPlaces: GooglePlaceSummary[] = stops.map((stop) => ({
    place_id: `stop-${stop.stop_id}`,
    name: stop.title,
    lat: stop.latitude,
    lng: stop.longitude,
    address: route.city,
    types: [],
    google_maps_uri: '',
  }));
  const mapCenter =
    stops.length > 0
      ? { lat: stops[0].latitude, lng: stops[0].longitude }
      : { lat: 41.0082, lng: 28.9784 };

  const metaDesc =
    route.seo_description?.trim() ||
    `${route.city} — ${route.estimated_minutes} dakikalık yürüyüş rotası, ${stops.length} durak. Sesli anlatım ve harita ile keşfet.`;

  return (
    <section className="space-y-6">
      <PageMeta
        title={`${route.title} — ${route.city} Yürüyüş Rotası`}
        description={metaDesc}
        path={`/routes/${route.route_id}`}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: route.title,
          description: metaDesc,
          touristType: route.tags.join(', ') || 'Genel kültür',
          offers: {
            '@type': 'Offer',
            price: route.price,
            priceCurrency: 'TRY',
          },
        }}
      />
      <Breadcrumbs
        items={[
          { label: 'Keşfet', to: '/discover' },
          { label: route.city },
          { label: route.title },
        ]}
      />

      <header className="route-page-header overflow-hidden rounded-[22px] p-4 shadow-lift sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{route.city}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{route.title}</h1>
        {route.seo_description ? (
          <p className="route-card-muted mt-2 text-sm leading-relaxed">{route.seo_description}</p>
        ) : null}
        <p className="route-card-muted mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span>{route.estimated_minutes} dakika</span>
          <span aria-hidden="true">·</span>
          <span>{stops.length} durak</span>
          <span aria-hidden="true">·</span>
          <span>₺{route.price.toFixed(2)}</span>
          {guide ? (
            <>
              <span aria-hidden="true">·</span>
              <Link className="font-semibold underline" to={`/rehberler/${guide.guide_id}`}>
                {guide.full_name}
              </Link>
              <VerifiedGuideBadge
                compact
                verified={guide.verification_status === 'verified' || guide.is_verified}
              />
            </>
          ) : (
            <>
              <span aria-hidden="true">·</span>
              <span>Rehber #{route.guide_id}</span>
            </>
          )}
        </p>
        {!stripeEnabled ? (
          <p className="mt-2 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100">
            Demo ödeme modu — gerçek tahsilat yok.{' '}
            <Link className="underline" to="/odeme-guvenlik">
              Detay
            </Link>
          </p>
        ) : null}
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

      <RouteQualityPanel
        route={route}
        stops={stops}
        guide={guide}
        stripeEnabled={stripeEnabled}
        avgRating={avgRating}
      />

      {stops.length > 0 ? (
        <section aria-labelledby="map-preview-title">
          <h2 className="font-display text-xl font-bold text-heritage-ink dark:text-stone-50" id="map-preview-title">
            Harita önizleme
          </h2>
          <div className="mt-3">
            <LeafletRegionMap center={mapCenter} zoom={14} places={mapPlaces} />
          </div>
        </section>
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
                      <div className="space-y-2">
                        <button
                          className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-900/15 px-3 text-sm font-semibold hover:border-primary dark:border-white/15"
                          type="button"
                          onClick={() => void handleListen(stop)}
                          disabled={audioBusy}
                          aria-busy={audioBusy}
                        >
                          <Play className="h-4 w-4" aria-hidden="true" />
                          {audioBusy ? 'Ses yükleniyor…' : speaking ? 'Sesi durdur' : 'Sesli rehberi başlat'}
                        </button>
                        {stop.description ? (
                          <details className="rounded-lg border border-stone-900/10 bg-stone-50/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900/50">
                            <summary className="cursor-pointer font-semibold text-stone-700 dark:text-stone-300">
                              Metin alternatifi (ses dinleyemiyorsan)
                            </summary>
                            <p className="mt-2 leading-relaxed text-stone-600 dark:text-stone-400">{stop.description}</p>
                          </details>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {stops.length === 0 ? <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">Bu rota için durak kaydı yok.</p> : null}
      </section>

      <div className="text-center text-xs text-stone-500">
        İade:{' '}
        <Link className="font-semibold text-primary underline" to="/iade">
          iade politikası
        </Link>
        <div className="mt-2 flex justify-center">
          <ContentReportForm entityType="route" entityId={route.route_id} />
        </div>
      </div>

      <RouteRecommendNps routeId={route.route_id} routeTitle={route.title} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RouteNotesPanel routeId={route.route_id} />
        <RouteReviewsPanel routeId={route.route_id} />
      </div>
    </section>
  );
}
