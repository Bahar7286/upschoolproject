import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '../ui/empty-state';
import { ErrorAlert } from '../ui/error-alert';
import { EMPTY_STATES } from '../../content/empty-states';
import { mapError } from '../../lib/user-errors';
import {
  listGuideRoutes,
  publishGuideRoute,
  submitGuideRouteReview,
} from '../../services/guide-service';
import type { RouteResponse } from '../../types/route';
import { useAuthStore } from '../../stores/auth-store';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Taslak',
  in_review: 'İncelemede',
  changes_requested: 'Düzeltme gerekli',
  approved: 'Onaylandı — yayınla',
  published: 'Yayında',
  unpublished: 'Yayından kaldırıldı',
  archived: 'Arşiv',
};

export function GuideRoutesPanel(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    if (!user || user.role !== 'guide') return;
    try {
      const res = await listGuideRoutes(user.user_id);
      setRoutes(res.items);
      setError('');
    } catch (err) {
      setError(mapError(err).message);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.user_id]);

  const handleSubmit = async (routeId: number) => {
    if (!accessToken || !user) return;
    setBusy(routeId);
    try {
      await submitGuideRouteReview(accessToken, user.user_id, routeId);
      await load();
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async (routeId: number) => {
    if (!accessToken || !user) return;
    setBusy(routeId);
    try {
      await publishGuideRoute(accessToken, user.user_id, routeId);
      await load();
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
      <h2 className="font-display text-lg font-bold">Rotalarım</h2>
      <p className="mt-1 text-sm text-stone-600">Taslak → incelemeye gönder → admin onayı → yayınla</p>
      {error ? (
        <div className="mt-2">
          <ErrorAlert error={{ kind: 'api', message: error }} />
        </div>
      ) : null}
      {routes.length === 0 ? (
        <div className="mt-4">
          <EmptyState {...EMPTY_STATES.guideRoutes} />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {routes.map((r) => (
            <li key={r.route_id} className="rounded-xl border border-stone-900/10 p-3 dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link className="font-bold text-primary hover:underline" to={`/routes/${r.route_id}`}>
                    {r.title}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {STATUS_LABEL[r.status ?? 'draft'] ?? r.status} · ₺{r.price.toFixed(2)}
                  </p>
                  {r.moderation_note ? (
                    <p className="mt-1 text-xs text-amber-700">Admin: {r.moderation_note}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.status === 'draft' || r.status === 'changes_requested') && accessToken ? (
                    <button
                      type="button"
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      disabled={busy === r.route_id}
                      onClick={() => void handleSubmit(r.route_id)}
                    >
                      İncelemeye gönder
                    </button>
                  ) : null}
                  {r.status === 'approved' && accessToken ? (
                    <button
                      type="button"
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      disabled={busy === r.route_id}
                      onClick={() => void handlePublish(r.route_id)}
                    >
                      Yayınla
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
