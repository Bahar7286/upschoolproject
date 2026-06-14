import type { FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  createEmptyDraftStop,
  draftStopFromResponse,
  RouteStopsBuilder,
  validateDraftStops,
  type DraftStop,
} from '../components/guide/route-stops-builder';
import { PageSkeleton } from '../components/loading/page-skeleton';
import { LoadingButton } from '../components/ui/loading-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import {
  inputErrorClass,
  validateRequired,
  type FieldErrors,
} from '../lib/validation';
import { listCities } from '../services/city-service';
import { getGuideRoute, updateGuideRoute } from '../services/guide-service';
import { createStop, deleteStop, listStops, updateStop } from '../services/stop-service';
import { useAuthStore } from '../stores/auth-store';

const EDITABLE_STATUSES = new Set(['draft', 'changes_requested']);

const fieldClass = (hasError: boolean) =>
  `mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950 ${
    hasError ? inputErrorClass : ''
  }`;

async function syncRouteStops(
  routeId: number,
  accessToken: string,
  originalStopIds: number[],
  drafts: DraftStop[],
): Promise<void> {
  const keptIds = new Set(drafts.filter((s) => s.stopId).map((s) => s.stopId!));
  for (const stopId of originalStopIds) {
    if (!keptIds.has(stopId)) {
      await deleteStop(routeId, stopId, accessToken);
    }
  }
  for (let i = 0; i < drafts.length; i += 1) {
    const stop = drafts[i];
    const payload = {
      title: stop.title.trim(),
      description: stop.description.trim(),
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
      order_index: i,
    };
    if (stop.stopId) {
      await updateStop(routeId, stop.stopId, payload, accessToken);
    } else {
      await createStop(routeId, payload, accessToken);
    }
  }
}

export default function GuideEditRoutePage(): ReactElement {
  const { t } = useI18n();
  const { routeId: routeIdParam } = useParams();
  const routeId = Number(routeIdParam);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(120);
  const [price, setPrice] = useState(0);
  const [tagsText, setTagsText] = useState('');
  const [status, setStatus] = useState('');
  const [stops, setStops] = useState<DraftStop[]>([]);
  const [originalStopIds, setOriginalStopIds] = useState<number[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stopErrors, setStopErrors] = useState<Record<string, string>>({});
  const { run, loading } = useSubmitLock();

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const canEdit = EDITABLE_STATUSES.has(status);

  useEffect(() => {
    if (!user || user.role !== 'guide' || !Number.isFinite(routeId) || routeId <= 0) {
      setLoadingRoute(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingRoute(true);
      setError('');
      try {
        const [route, routeStops] = await Promise.all([
          getGuideRoute(user.user_id, routeId),
          listStops(routeId, accessToken),
        ]);
        if (cancelled) return;
        setTitle(route.title);
        setCity(route.city);
        setEstimatedMinutes(route.estimated_minutes);
        setPrice(route.price);
        setTagsText(route.tags.join(', '));
        setStatus(route.status ?? 'draft');
        const drafts =
          routeStops.length > 0
            ? routeStops
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map(draftStopFromResponse)
            : [createEmptyDraftStop()];
        setStops(drafts);
        setOriginalStopIds(routeStops.map((s) => s.stop_id));
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, routeId, accessToken]);

  if (user?.role !== 'guide') {
    return (
      <section className="mx-auto max-w-lg space-y-4">
        <p className="text-sm text-stone-600 dark:text-stone-400">{t('guideForm.guideOnly')}</p>
        <Link className="font-bold text-primary" to="/register">
          {t('guideForm.guideSignup')}
        </Link>
      </section>
    );
  }

  if (!Number.isFinite(routeId) || routeId <= 0) {
    return (
      <section className="mx-auto max-w-lg space-y-4">
        <p className="text-sm text-red-700">{t('guideForm.invalidRoute')}</p>
        <Link className="font-bold text-primary" to="/guide">
          {t('guideForm.backPanel')}
        </Link>
      </section>
    );
  }

  if (loadingRoute) {
    return <PageSkeleton />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    setError('');
    const errs: FieldErrors = {};
    const titleErr = validateRequired(title, t('guideForm.titleLabel'));
    const cityErr = validateRequired(city, t('guideForm.cityLabel'));
    if (titleErr) errs.title = titleErr;
    if (cityErr) errs.city = cityErr;
    if (estimatedMinutes < 15 || estimatedMinutes > 720) {
      errs.estimatedMinutes = t('guideForm.durationRange');
    }
    if (price < 0) errs.price = t('guideForm.priceMin');
    const stopErrs = validateDraftStops(stops, t);
    setFieldErrors(errs);
    setStopErrors(stopErrs);
    if (Object.keys(errs).length > 0 || Object.keys(stopErrs).length > 0) return;

    if (!accessToken) {
      setError(t('guideForm.sessionError'));
      return;
    }

    const tags = tagsText
      .split(/[,;]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    await run(async () => {
      try {
        await updateGuideRoute(user.user_id, routeId, {
          title: title.trim(),
          city: city.trim(),
          estimated_minutes: estimatedMinutes,
          price,
          tags: tags.length ? tags : [t('guideForm.defaultTags').split(',')[0]?.trim() || 'kültür'],
        });
        await syncRouteStops(routeId, accessToken, originalStopIds, stops);
        navigate('/guide', { replace: true, state: { routeUpdated: routeId } });
      } catch (err) {
        setError(formatApiError(err));
      }
    });
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link className="text-sm font-semibold text-primary hover:underline" to="/guide">
          {t('guideForm.backPanel')}
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t('guideForm.editTitle')}</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{t('guideForm.editSubtitle')}</p>
      </header>

      {!canEdit ? (
        <p
          className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/30 dark:text-amber-100"
          role="alert"
        >
          {t('guideForm.notEditable')}
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        className="space-y-6 rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95"
        onSubmit={handleSubmit}
      >
        <fieldset className="space-y-4" disabled={!canEdit}>
          <label className="block text-sm font-semibold">
            {t('guideForm.titleLabel')}
            <input
              className={fieldClass(!!fieldErrors.title)}
              maxLength={180}
              minLength={3}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {fieldErrors.title ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.title}</span> : null}
          </label>

          <label className="block text-sm font-semibold">
            {t('guideForm.cityLabel')}
            <input
              className={fieldClass(!!fieldErrors.city)}
              list="guide-edit-route-cities"
              maxLength={120}
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <datalist id="guide-edit-route-cities">
              {cities.map((c) => (
                <option key={c.city_id} value={c.name_tr} />
              ))}
            </datalist>
            {fieldErrors.city ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.city}</span> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t('guideForm.durationHint')}
              <input
                className={fieldClass(!!fieldErrors.estimatedMinutes)}
                max={720}
                min={15}
                required
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              />
              {fieldErrors.estimatedMinutes ? (
                <span className="mt-1 block text-xs text-red-600">{fieldErrors.estimatedMinutes}</span>
              ) : null}
            </label>

            <label className="block text-sm font-semibold">
              {t('guideForm.priceLabel')}
              <input
                className={fieldClass(!!fieldErrors.price)}
                min={0}
                required
                step="0.01"
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              {fieldErrors.price ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.price}</span> : null}
            </label>
          </div>

          <label className="block text-sm font-semibold">
            {t('guideForm.tagsLabel')}
            <input
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 dark:border-zinc-600"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </label>
        </fieldset>

        {canEdit ? (
          <RouteStopsBuilder
            cities={cities}
            city={city}
            errors={stopErrors}
            stops={stops}
            onChange={setStops}
          />
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {canEdit ? (
            <LoadingButton className="min-h-[48px] flex-1 sm:flex-none" loading={loading} type="submit">
              {t('guideForm.saveChanges')}
            </LoadingButton>
          ) : null}
          <Link
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-stone-300 px-5 font-semibold dark:border-zinc-600"
            to="/guide"
          >
            {canEdit ? t('guideForm.cancel') : t('guideForm.backToPanel')}
          </Link>
        </div>
      </form>
    </section>
  );
}
