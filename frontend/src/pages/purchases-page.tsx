import { ShoppingBag } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatApiError } from '../lib/api';
import { listPurchasesByUser } from '../services/purchase-service';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { useAuthStore } from '../stores/auth-store';
import type { PurchaseResponse } from '../types/purchase';

export default function PurchasesPage(): ReactElement {
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
        if (!cancelled) setError(formatApiError(err));
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
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="pur-title">
          Satın alımlarım
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">İndirilebilir rota paketleri ve ödeme durumu</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Yükleniyor">
          <div className="h-20 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" />
          <div className="h-20 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-10 text-center dark:border-white/10 dark:bg-zinc-900/95">
          <ShoppingBag className="mx-auto h-12 w-12 text-stone-400" aria-hidden="true" />
          <p className="mt-4 font-semibold">Henüz satın alımın yok</p>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Rotaları keşfetmeye başla</p>
          <Link className="tap-scale mt-5 inline-flex min-h-[48px] items-center rounded-xl bg-primary px-6 font-bold text-white shadow-md hover:bg-primary-dark" to="/discover">
            Keşfet
          </Link>
        </div>
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
                  {p.status === 'confirmed' ? 'Tamamlandı ✓' : p.status}
                </span>
                <Link
                  className="tap-scale inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
                  to={`/routes/${p.route_id}`}
                >
                  Rotayı aç
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
