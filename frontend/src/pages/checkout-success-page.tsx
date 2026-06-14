import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { confirmCheckout } from '../services/payment-checkout-service';
import { useAuthStore } from '../stores/auth-store';

export default function CheckoutSuccessPage(): ReactElement {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionId = params.get('session_id');
  const purchaseId = Number(params.get('purchase_id'));
  const acceptOffer = params.get('accept_offer') === '1';

  const [ref, setRef] = useState('');
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!accessToken || !sessionId || !Number.isFinite(purchaseId) || purchaseId <= 0) {
      setBusy(false);
      if (!sessionId) setError(t('checkout.stripeMissing', 'Stripe oturumu bulunamadı.'));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const confirmed = await confirmCheckout(accessToken, purchaseId, acceptOffer, sessionId);
        if (!cancelled) {
          setRef(confirmed.transaction_ref);
          setAmount(confirmed.amount);
        }
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionId, purchaseId, acceptOffer]);

  if (busy) {
    return (
      <section className="mx-auto max-w-lg py-12 text-center">
        <p className="text-sm text-theme-muted">{t('checkout.verifying', 'Ödeme doğrulanıyor…')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-lg space-y-4 text-center">
        <p className="alert-error rounded-xl px-4 py-3 text-sm" role="alert">
          {error}
        </p>
        <Link className="font-bold text-primary" to="/talepler">
          {t('checkout.backToTrips', 'Taleplere dön')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg space-y-6 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-primary" aria-hidden="true" />
      <h1 className="font-display text-2xl font-extrabold text-theme">{t('checkout.confirmedTitle', 'Ödeme onaylandı')}</h1>
      <p className="text-sm text-theme-muted">{t('checkout.confirmedAmount', { amount: amount.toFixed(2) }, '₺{amount} işlendi.')}</p>
      {ref ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 font-mono text-sm font-bold">
          {ref}
        </p>
      ) : null}
      <Link className="tap-scale inline-flex min-h-[48px] items-center rounded-xl bg-primary px-6 font-bold text-white" to="/purchases">
        {t('checkout.myPurchases', 'Satın alımlarım')}
      </Link>
    </section>
  );
}
