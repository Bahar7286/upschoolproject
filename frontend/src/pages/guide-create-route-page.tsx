import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  createEmptyDraftStop,
  RouteStopsBuilder,
  validateDraftStops,
  type DraftStop,
} from '../components/guide/route-stops-builder';
import { LoadingButton } from '../components/ui/loading-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { formatApiError } from '../lib/api';
import {
  inputErrorClass,
  validateRequired,
  type FieldErrors,
} from '../lib/validation';
import { listCities } from '../services/city-service';
import { createGuideRoute } from '../services/guide-service';
import { createStop } from '../services/stop-service';
import { useAuthStore } from '../stores/auth-store';

const DEFAULT_TAGS = 'tarih, kültür';

const fieldClass = (hasError: boolean) =>
  `mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950 ${
    hasError ? inputErrorClass : ''
  }`;

export default function GuideCreateRoutePage(): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [estimatedMinutes, setEstimatedMinutes] = useState(120);
  const [price, setPrice] = useState(149);
  const [tagsText, setTagsText] = useState(DEFAULT_TAGS);
  const [stops, setStops] = useState<DraftStop[]>([createEmptyDraftStop()]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [stopErrors, setStopErrors] = useState<Record<string, string>>({});
  const { run, loading } = useSubmitLock();

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (user?.role !== 'guide') {
    return (
      <section className="mx-auto max-w-lg space-y-4">
        <p className="text-sm text-stone-600 dark:text-stone-400">Bu sayfa yalnızca rehber hesapları içindir.</p>
        <Link className="font-bold text-primary" to="/register">
          Rehber kaydı
        </Link>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const errs: FieldErrors = {};
    const titleErr = validateRequired(title, 'Rota başlığı');
    const cityErr = validateRequired(city, 'Şehir');
    if (titleErr) errs.title = titleErr;
    if (cityErr) errs.city = cityErr;
    if (estimatedMinutes < 15 || estimatedMinutes > 720) {
      errs.estimatedMinutes = 'Süre 15–720 dakika arasında olmalı.';
    }
    if (price < 0) errs.price = 'Fiyat 0 veya üzeri olmalı.';
    const stopErrs = validateDraftStops(stops);
    setFieldErrors(errs);
    setStopErrors(stopErrs);
    if (Object.keys(errs).length > 0 || Object.keys(stopErrs).length > 0) return;

    if (!accessToken) {
      setError('Oturum süresi dolmuş olabilir. Çıkış yapıp tekrar giriş yap.');
      return;
    }

    const tags = tagsText
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);

    await run(async () => {
      try {
        const route = await createGuideRoute(user.user_id, {
          title: title.trim(),
          city: city.trim(),
          estimated_minutes: estimatedMinutes,
          price,
          tags: tags.length ? tags : ['kültür'],
        });

        for (let i = 0; i < stops.length; i += 1) {
          const stop = stops[i];
          await createStop(
            route.route_id,
            {
              title: stop.title.trim(),
              description: stop.description.trim(),
              latitude: Number(stop.latitude),
              longitude: Number(stop.longitude),
              order_index: i,
            },
            accessToken,
          );
        }

        navigate('/guide', { replace: true, state: { routeCreated: route.route_id } });
      } catch (err) {
        setError(formatApiError(err));
      }
    });
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link className="text-sm font-semibold text-primary hover:underline" to="/guide">
          ← Rehber paneli
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Yeni rota oluştur</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Taslak olarak kaydedilir; durakları sırayla ekle, ardından incelemeye gönderebilirsin.
        </p>
      </header>

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
        <div className="space-y-4">
          <label className="block text-sm font-semibold">
            Rota başlığı
            <input
              className={fieldClass(!!fieldErrors.title)}
              maxLength={180}
              minLength={3}
              placeholder="Örn. Sultanahmet kültür yürüyüşü"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {fieldErrors.title ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.title}</span> : null}
          </label>

          <label className="block text-sm font-semibold">
            Şehir
            <input
              className={fieldClass(!!fieldErrors.city)}
              list="guide-route-cities"
              maxLength={120}
              placeholder="İstanbul"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <datalist id="guide-route-cities">
              {cities.map((c) => (
                <option key={c.city_id} value={c.name_tr} />
              ))}
            </datalist>
            {fieldErrors.city ? <span className="mt-1 block text-xs text-red-600">{fieldErrors.city}</span> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Tahmini süre (dk)
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
              Fiyat (₺)
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
            Etiketler (virgülle ayır)
            <input
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 dark:border-zinc-600"
              placeholder="tarih, sanat, yemek"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </label>
        </div>

        <RouteStopsBuilder
          cities={cities}
          city={city}
          errors={stopErrors}
          stops={stops}
          onChange={setStops}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <LoadingButton className="min-h-[48px] flex-1 sm:flex-none" loading={loading} type="submit">
            Rotayı kaydet
          </LoadingButton>
          <Link
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-stone-300 px-5 font-semibold dark:border-zinc-600"
            to="/guide"
          >
            İptal
          </Link>
        </div>
      </form>
    </section>
  );
}
