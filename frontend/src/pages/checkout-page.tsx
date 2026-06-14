import type { FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Lock, Shield } from 'lucide-react';

import { BackButton } from '../components/ui/back-button';

import { formatApiError } from '../lib/api';
import {
  confirmCheckout,
  fetchPaymentConfig,
  startCheckout,
  startStripeCheckout,
} from '../services/payment-checkout-service';
import { useAuthStore } from '../stores/auth-store';

export type CheckoutState = {
  kind: 'offer' | 'route';
  amount: number;
  title: string;
  routeId?: number | null;
  offerId?: number;
  requestId?: number;
  guideName?: string;
  platformFee?: number;
};

export default function CheckoutPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CheckoutState | null;
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [cardHolder, setCardHolder] = useState(user?.full_name ?? '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ ref: string; amount: number } | null>(null);

  useEffect(() => {
    fetchPaymentConfig()
      .then((c) => setStripeEnabled(c.stripe_enabled))
      .catch(() => setStripeEnabled(false));
  }, []);

  if (!state || !accessToken || !user) {
    return (
      <section className="mx-auto max-w-lg space-y-4 text-center">
        <p className="text-sm">Ödeme oturumu bulunamadı.</p>
        <Link className="font-bold text-primary" to="/talepler">
          Taleplere dön
        </Link>
      </section>
    );
  }

  const last4 = cardNumber.replace(/\D/g, '').slice(-4);
  const platformFee = state.platformFee ?? Math.round(state.amount * 0.15 * 100) / 100;
  const guideNet = Math.round((state.amount - platformFee) * 100) / 100;
  const acceptOffer = state.kind === 'offer' && Boolean(state.offerId && state.requestId);

  const basePayload = {
    user_id: user.user_id,
    amount: state.amount,
    currency: 'TRY',
    route_id: state.routeId ?? undefined,
    offer_id: state.offerId,
    trip_request_id: state.requestId,
    payment_method: 'card' as const,
  };

  const handleStripePay = async () => {
    setBusy(true);
    setError('');
    try {
      const origin = window.location.origin;
      const accept = acceptOffer ? '1' : '0';
      const successUrl = `${origin}/odeme/basarili?purchase_id=PLACEHOLDER&accept_offer=${accept}&session_id={CHECKOUT_SESSION_ID}`;
      const stripeSession = await startStripeCheckout(accessToken, {
        ...basePayload,
        card_holder: user.full_name,
        card_last4: '4242',
        success_url: successUrl,
        cancel_url: `${origin}/odeme`,
      });
      window.location.href = stripeSession.checkout_url;
    } catch (err) {
      setError(formatApiError(err));
      setBusy(false);
    }
  };

  const handleDemoPay = async (e: FormEvent) => {
    e.preventDefault();
    if (last4.length !== 4) {
      setError('Kart numarasının son 4 hanesini girin.');
      return;
    }
    if (last4 === '0000') {
      setError('Test kartı 0000 reddedilir.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const pending = await startCheckout(accessToken, {
        ...basePayload,
        card_holder: cardHolder,
        card_last4: last4,
      });
      const confirmed = await confirmCheckout(accessToken, pending.purchase_id, acceptOffer);
      setDone({ ref: confirmed.transaction_ref, amount: confirmed.amount });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="mx-auto max-w-lg space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" aria-hidden="true" />
        <h1 className="font-display text-2xl font-extrabold">Ödeme onaylandı</h1>
        <p className="text-sm text-theme-muted">₺{done.amount.toFixed(2)} işlendi.</p>
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 font-mono text-sm font-bold">
          {done.ref}
        </p>
        <Link className="tap-scale inline-flex min-h-[48px] items-center rounded-xl bg-primary px-6 font-bold text-white" to="/purchases">
          Satın alımlarım
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <BackButton />
      <header>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-theme">Güvenli ödeme</h1>
        <p className="mt-1 text-sm text-theme-muted">{state.title}</p>
        <p className="mt-2 text-xs text-theme-muted">
          Ödemen güvenli bağlantı ile işlenir.{' '}
          <Link className="font-semibold text-primary underline" to="/odeme-guvenlik">
            Ödeme güvenliği
          </Link>
          {' · '}
          <Link className="font-semibold text-primary underline" to="/iade">
            İade politikası
          </Link>
        </p>
      </header>

      <div className="theme-card p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-theme-muted">Toplam</dt>
            <dd className="font-bold">₺{state.amount.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-theme-muted">Platform (%15)</dt>
            <dd>₺{platformFee.toFixed(2)}</dd>
          </div>
          {state.guideName ? (
            <div className="flex justify-between">
              <dt className="text-theme-muted">Rehber ({state.guideName})</dt>
              <dd className="text-primary">₺{guideNet.toFixed(2)}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {stripeEnabled ? (
        <div className="theme-card space-y-4 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-theme">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            Stripe Checkout ile güvenli ödeme
          </p>
          {error ? (
            <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="tap-scale flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white disabled:opacity-60"
            type="button"
            disabled={busy}
            onClick={() => void handleStripePay()}
          >
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            {busy ? 'Yönlendiriliyor…' : `Stripe ile ₺${state.amount.toFixed(2)} öde`}
          </button>
        </div>
      ) : (
        <form className="theme-card space-y-4 p-5" onSubmit={handleDemoPay}>
          <div className="flex items-center gap-2 text-sm font-semibold text-theme-muted">
            <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
            Test ödemesi
          </div>
          <label className="block text-sm font-semibold">
            Kart üzerindeki isim
            <input
              className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            Kart numarası
            <input
              className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 font-mono"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="theme-input rounded-xl border px-3 py-2.5"
              placeholder="12/28"
              required
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
            <input
              className="theme-input rounded-xl border px-3 py-2.5"
              placeholder="CVC"
              required
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
            />
          </div>
          <input
            className="theme-input w-full rounded-xl border px-3 py-2.5"
            placeholder="Kupon (isteğe bağlı)"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
          {error ? (
            <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="tap-scale flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? 'İşleniyor…' : `₺${state.amount.toFixed(2)} öde`}
          </button>
          <p className="text-center text-xs text-theme-muted">
            Bu ortamda gerçek ücret tahsil edilmez; yalnızca deneme amaçlı kayıt oluşturulur.
          </p>
        </form>
      )}
    </section>
  );
}
