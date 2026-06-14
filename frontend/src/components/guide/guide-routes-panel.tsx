import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ButtonLink } from '../ui/button';
import { EmptyState } from '../ui/empty-state';
import { ErrorAlert } from '../ui/error-alert';
import { ApiError, getApiBaseUrl } from '../../lib/api';
import { useEmptyStates } from '../../hooks/use-empty-states';
import { useI18n } from '../../lib/i18n';
import { mapError } from '../../lib/user-errors';
import {
  listGuideRoutes,
  publishGuideRoute,
  submitGuideRouteReview,
} from '../../services/guide-service';
import type { RouteResponse } from '../../types/route';
import { useAuthStore } from '../../stores/auth-store';

const STATUS_KEYS: Record<string, string> = {
  draft: 'guideRoutes.statusDraft',
  in_review: 'guideRoutes.statusInReview',
  changes_requested: 'guideRoutes.statusChanges',
  approved: 'guideRoutes.statusApproved',
  published: 'guideRoutes.statusPublished',
  unpublished: 'guideRoutes.statusUnpublished',
  archived: 'guideRoutes.statusArchived',
};

export function GuideRoutesPanel(): ReactElement {
  const { t } = useI18n();
  const emptyStates = useEmptyStates();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [createdBanner, setCreatedBanner] = useState('');
  const [updatedBanner, setUpdatedBanner] = useState('');

  const load = async () => {
    if (!user || user.role !== 'guide') return;
    try {
      const res = await listGuideRoutes(user.user_id);
      setRoutes(res.items);
      setError('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(t('guideRoutes.profileNotFound', 'Rehber profili bulunamadı.'));
      } else if (err instanceof TypeError || (err instanceof ApiError && err.status === 0)) {
        setError(t('guideRoutes.serverUnreachable', 'Sunucuya ulaşılamıyor ({url}).').replace('{url}', getApiBaseUrl()));
      } else {
        setError(mapError(err).message);
      }
    }
  };

  useEffect(() => {
    void load();
  }, [user?.user_id, location.key]);

  useEffect(() => {
    const state = location.state as { routeCreated?: number; routeUpdated?: number } | null;
    if (state?.routeCreated) {
      setCreatedBanner(t('guideRoutes.createdBanner', 'Rota taslak olarak kaydedildi.'));
      window.history.replaceState({}, document.title);
    }
    if (state?.routeUpdated) {
      setUpdatedBanner(t('guideRoutes.updatedBanner', 'Rota güncellendi.'));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{t('guideRoutes.title', 'Rotalarım')}</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {t('guideRoutes.workflowHint', 'Taslak → incelemeye gönder → admin onayı → yayınla')}
          </p>
        </div>
        <ButtonLink className="shrink-0" to="/guide/rotalar/yeni">
          {t('guideRoutes.newRoute', '+ Yeni rota')}
        </ButtonLink>
      </div>
      {createdBanner ? (
        <p className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary" role="status">
          {createdBanner}
        </p>
      ) : null}
      {updatedBanner ? (
        <p className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary" role="status">
          {updatedBanner}
        </p>
      ) : null}
      {error ? (
        <div className="mt-2">
          <ErrorAlert error={{ kind: 'api', message: error }} />
        </div>
      ) : null}
      {routes.length === 0 ? (
        <div className="mt-4">
          <EmptyState {...emptyStates.guideRoutes} />
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
                    {t(STATUS_KEYS[r.status ?? 'draft'] ?? 'guideRoutes.statusDraft', r.status ?? 'draft')} · ₺{r.price.toFixed(2)}
                  </p>
                  {r.moderation_note ? (
                    <p className="mt-1 text-xs text-amber-700">{t('guideRoutes.adminNote', 'Admin:')} {r.moderation_note}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.status === 'draft' || r.status === 'changes_requested') ? (
                    <Link
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-bold dark:border-zinc-600"
                      to={`/guide/rotalar/${r.route_id}/duzenle`}
                    >
                      {t('guideRoutes.edit', 'Düzenle')}
                    </Link>
                  ) : null}
                  {(r.status === 'draft' || r.status === 'changes_requested') && accessToken ? (
                    <button
                      type="button"
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      disabled={busy === r.route_id}
                      onClick={() => void handleSubmit(r.route_id)}
                    >
                      {t('guideRoutes.submitReview', 'İncelemeye gönder')}
                    </button>
                  ) : null}
                  {r.status === 'approved' && accessToken ? (
                    <button
                      type="button"
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      disabled={busy === r.route_id}
                      onClick={() => void handlePublish(r.route_id)}
                    >
                      {t('guideRoutes.publish', 'Yayınla')}
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
