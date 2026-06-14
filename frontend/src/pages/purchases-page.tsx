import { ShoppingBag } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ListSkeleton } from '../components/loading/page-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorAlert } from '../components/ui/error-alert';
import { BackButton } from '../components/ui/back-button';
import { useEmptyStates } from '../hooks/use-empty-states';
import { useI18n } from '../lib/i18n';
import { mapError } from '../lib/user-errors';
import { listPurchasesByUser } from '../services/purchase-service';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { useAuthStore } from '../stores/auth-store';
import type { PurchaseResponse } from '../types/purchase';

export default function PurchasesPage(): ReactElement {
  const { t } = useI18n();
  const emptyStates = useEmptyStates();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: routes = [] } = useRoutesQuery();

  const [items, setItems] = useState<PurchaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listPurchasesByUser(user.user_id, accessToken);
        if (!cancelled) setItems(data.filter((p) => p.user_id === user.user_id));
      } catch (err) {
        if (!cancelled) setError(mapError(err, 'purchases').message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  const routeTitle = (routeId: number) => routes.find((r) => r.route_id === routeId)?.title ?? `Rota #${routeId}`;

  return (
    <section className="mx-auto max-w-2xl space-y-6" aria-labelledby="pur-title">
      <BackButton />
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="pur-title">
          {t('purchases.title', 'Satın alımlarım')}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {t('purchases.subtitle', 'İndirilebilir rota paketleri ve ödeme durumu')}
        </p>
      </header>

      {error ? <ErrorAlert error={mapError(new Error(error), 'purchases')} /> : null}

      {loading ? <ListSkeleton count={3} /> : items.length === 0 ? (
        <EmptyState {...emptyStates.purchases} />
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li
              className="flex flex-col gap-3 rounded-[22px] border border-stone-900/10 bg-white/90 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-zinc-900/95"
              key={p.purchase_id}
            >
              <div>
                <p className="font-bold text-heritage-ink dark:text-stone-50">{routeTitle(p.route_id)}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  #{p.purchase_id} · {p.currency} {p.amount.toFixed(2)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    p.status === 'confirmed'
                      ? 'bg-primary/10 text-primary-dark dark:text-primary'
                      : 'bg-stone-100 text-stone-600 dark:bg-zinc-800'
                  }`}
                >
                  {p.status === 'confirmed' ? t('purchases.confirmed', 'Tamamlandı ✓') : p.status}
                </span>
                <Link
                  className="tap-scale inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
                  to={`/routes/${p.route_id}`}
                >
                  {t('purchases.openRoute', 'Rotayı aç')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
