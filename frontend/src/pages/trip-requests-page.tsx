import type { FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

import { EmptyState } from '../components/ui/empty-state';
import { BackButton } from '../components/ui/back-button';
import { ErrorAlert } from '../components/ui/error-alert';
import { EMPTY_STATES } from '../content/empty-states';
import { mapError } from '../lib/user-errors';
import {
  listMyTripRequests,
  listOpenTripRequests,
  submitGuideOffer,
  type TripRequest,
} from '../services/trip-request-service';
import { useAuthStore } from '../stores/auth-store';

export default function TripRequestsPage(): ReactElement {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isGuide = user?.role === 'guide';

  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [error, setError] = useState('');
  const [offerRequestId, setOfferRequestId] = useState<number | null>(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerTotal, setOfferTotal] = useState(500);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    try {
      const data = isGuide
        ? await listOpenTripRequests(accessToken)
        : await listMyTripRequests(accessToken);
      setRequests(data);
      setError('');
    } catch (err) {
      setError(mapError(err).message);
    }
  };

  useEffect(() => {
    load();
  }, [accessToken, isGuide]);

  const goToCheckout = (req: TripRequest, offer: TripRequest['offers'][0]) => {
    navigate('/odeme', {
      state: {
        kind: 'offer',
        amount: offer.offered_total,
        title: `${req.title} — ${offer.guide_name}`,
        routeId: req.route_id,
        offerId: offer.offer_id,
        requestId: req.request_id,
        guideName: offer.guide_name,
        platformFee: offer.platform_fee,
      },
    });
  };

  const handleOffer = async (e: FormEvent, requestId: number) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    try {
      await submitGuideOffer(accessToken, requestId, {
        message: offerMessage,
        base_total: offerTotal,
      });
      setOfferRequestId(null);
      setOfferMessage('');
      await load();
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(false);
    }
  };

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="font-display text-2xl font-bold">Gezi talepleri</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">Talep oluşturmak veya teklif vermek için giriş yapın.</p>
        <Link className="tap-scale inline-flex min-h-[48px] items-center rounded-xl bg-primary px-6 font-bold text-white" to="/login">
          Giriş yap
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <BackButton />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {isGuide ? 'Açık gezi talepleri' : 'Taleplerim'}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {isGuide
              ? 'Onaylı rehber olarak taleplere teklif verin. 10+ kişide %10, 20+ kişide %15 grup indirimi otomatik uygulanır.'
              : 'Rotanız veya “burayı gezmek istiyorum” talebiniz için rehberler teklif gönderir; platform içinde kabul edin.'}
          </p>
        </div>
        {!isGuide ? (
          <Link
            className="tap-scale inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-4 font-bold text-white shadow-sm hover:bg-primary-dark"
            to="/talepler/yeni"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Talep oluştur
          </Link>
        ) : null}
      </header>

      {error ? <ErrorAlert error={{ kind: 'api', message: error }} /> : null}

      {requests.length === 0 ? (
        <EmptyState
          {...(isGuide ? EMPTY_STATES.search : EMPTY_STATES.tripHistory)}
          title={isGuide ? 'Şu an açık talep yok' : EMPTY_STATES.tripHistory.title}
          description={
            isGuide
              ? 'Yeni turist talepleri geldiğinde burada listelenecek.'
              : EMPTY_STATES.tripHistory.description
          }
          actionLabel={isGuide ? 'Keşfe git' : EMPTY_STATES.tripHistory.actionLabel}
          actionTo={isGuide ? '/discover' : '/talepler/yeni'}
        />
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li
              key={req.request_id}
              className="theme-card p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-theme">{req.title}</h2>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                  {req.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {req.city} · {req.preferred_date} ·{' '}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {req.group_size} kişi
                </span>
                {req.route_title ? ` · ${req.route_title}` : ''}
              </p>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{req.message}</p>
              {req.planned_stops?.length > 0 ? (
                <p className="mt-2 text-xs font-semibold text-primary">
                  Güzergah: {req.planned_stops.map((s) => s.name).join(' → ')}
                </p>
              ) : null}

              {isGuide && req.status === 'open' ? (
                <div className="mt-4">
                  {offerRequestId === req.request_id ? (
                    <form className="space-y-3" onSubmit={(e) => handleOffer(e, req.request_id)}>
                      <textarea
                        className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-[15px] dark:border-white/15 dark:bg-zinc-950"
                        placeholder="Teklif mesajınız…"
                        required
                        rows={3}
                        value={offerMessage}
                        onChange={(e) => setOfferMessage(e.target.value)}
                      />
                      <label className="block text-xs font-semibold text-stone-500">
                        Toplam (indirim öncesi, ₺)
                        <input
                          className="theme-input mt-1 w-full rounded-xl border px-3 py-2 text-[15px]"
                          min={1}
                          required
                          type="number"
                          value={offerTotal}
                          onChange={(e) => setOfferTotal(Number(e.target.value))}
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                          disabled={busy}
                          type="submit"
                        >
                          Teklif gönder
                        </button>
                        <button
                          className="rounded-xl border px-4 py-2 text-sm font-semibold"
                          type="button"
                          onClick={() => setOfferRequestId(null)}
                        >
                          İptal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="tap-scale mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold shadow-sm"
                      type="button"
                      onClick={() => {
                        setOfferRequestId(req.request_id);
                        setOfferMessage(`Merhaba, ${req.title} için teklifim.`);
                        setOfferTotal(req.budget > 0 ? req.budget : 500);
                      }}
                    >
                      Teklif ver
                    </button>
                  )}
                </div>
              ) : null}

              {!isGuide && req.offers.length > 0 ? (
                <ul className="mt-4 space-y-3 border-t border-stone-900/10 pt-4 dark:border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Gelen teklifler ({req.offer_count})
                  </p>
                  {req.offers.map((o) => (
                    <li
                      key={o.offer_id}
                      className="rounded-xl border border-stone-900/10 bg-stone-50/80 p-4 dark:border-white/10 dark:bg-zinc-800/50"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-bold">{o.guide_name}</span>
                        <span className="text-xs font-semibold text-stone-500">{o.status}</span>
                      </div>
                      <p className="mt-1 text-lg font-extrabold text-primary">₺{o.offered_total.toFixed(2)}</p>
                      <p className="text-xs text-stone-500">
                        Kişi başı ₺{o.offered_per_person.toFixed(2)} · {o.discount_label} · Platform ücreti ₺
                        {o.platform_fee.toFixed(2)}
                      </p>
                      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{o.message}</p>
                      {req.status === 'open' && o.status === 'pending' ? (
                        <button
                          className="tap-scale mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                          disabled={busy}
                          type="button"
                          onClick={() => goToCheckout(req, o)}
                        >
                          Öde ve kabul et
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {!isGuide && req.offer_count === 0 && req.status === 'open' ? (
                <p className="mt-3 text-xs text-stone-500">Rehberlerden teklif bekleniyor…</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
