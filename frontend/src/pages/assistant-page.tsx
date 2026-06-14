import { useQuery } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getQuickAssistantReply } from '../lib/assistant-intent';
import { AssistantMessageBody } from '../components/ai/assistant-message-body';
import { BackButton } from '../components/ui/back-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { assistantChat, type AssistantMessage } from '../services/ai-service';
import { listCities, listDistrictsByCity } from '../services/city-service';
import { listPlaces } from '../services/place-service';
import { HelpfulFeedback } from '../components/feedback/helpful-feedback';
import { ErrorAlert } from '../components/ui/error-alert';
import {
  ensureApiReady,
  formatApiError,
  getApiBaseUrl,
  subscribeApiConnection,
  type ApiConnectionState,
} from '../lib/api';
import { type UserFacingError } from '../lib/user-errors';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import { useI18n } from '../lib/i18n';

export default function AssistantPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const interests = useOnboardingStore((s) => s.interests);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const effectiveInterests = useMemo(
    () => (interests.length ? interests : user?.interests?.length ? user.interests : ['history', 'art', 'food']),
    [interests, user],
  );

  const preferredCity = useOnboardingStore((s) => s.preferredCity);
  const defaultCity =
    searchParams.get('city') ?? user?.preferred_city ?? preferredCity ?? 'İstanbul';
  const initialDistrict = searchParams.get('district') ?? '';
  const [city, setCity] = useState(defaultCity);
  const [district, setDistrict] = useState(initialDistrict);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const selectedCity = useMemo(
    () => cities.find((c) => c.name_tr === city) ?? null,
    [cities, city],
  );

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedCity?.city_id ?? 0],
    queryFn: () => listDistrictsByCity(selectedCity!.city_id),
    enabled: Boolean(selectedCity?.city_id),
    staleTime: 60 * 60 * 1000,
  });

  const { data: cityPlaces = [] } = useQuery({
    queryKey: ['assistant-places', city],
    queryFn: () => listPlaces({ city, limit: 300 }),
    enabled: city.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const venueLinkContext = useMemo(
    () => ({
      cityId: selectedCity?.city_id,
      cityName: city,
      places: cityPlaces,
      districts,
    }),
    [selectedCity?.city_id, city, cityPlaces, districts],
  );

  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<AssistantMessage[]>(() => [
    {
      role: 'assistant' as const,
      content:
        'Merhaba! 👋 Ben Historial-GO AI asistanınızım. Tarihi ve kültürel yerler hakkında sorularınızı yanıtlayabilirim. Nereye gideceksiniz, kaç gününüz var?',
    },
  ]);
  const [errorDetail, setErrorDetail] = useState<UserFacingError | null>(null);
  const [connState, setConnState] = useState<ApiConnectionState>('idle');

  useEffect(() => subscribeApiConnection(setConnState), []);

  useEffect(() => {
    void ensureApiReady(75_000);
  }, []);

  useEffect(() => {
    const fromPrefs = user?.preferred_city ?? preferredCity;
    if (!searchParams.get('city') && fromPrefs && fromPrefs !== city) {
      setCity(fromPrefs);
    }
  }, [user?.preferred_city, preferredCity, searchParams, city]);

  const { run, loading: sendLoading } = useSubmitLock();

  const handleSend = () => {
    if (sendLoading) return;
    setErrorDetail(null);
    const text = input.trim();
    if (!text) return;
    const next: AssistantMessage[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setInput('');

    const instant = getQuickAssistantReply(text, city, district);
    if (instant) {
      setMsgs((prev) => [...prev, { role: 'assistant', content: instant }]);
      return;
    }

    void run(async () => {
      try {
        const ready = await ensureApiReady(75_000);
        if (!ready) {
          setErrorDetail({
            kind: 'network',
            message:
              'Sunucu henüz uyanmadı. Render ücretsiz planda ilk istek 30–60 sn sürebilir; birkaç saniye bekleyip tekrar deneyin.',
            actionLabel: 'Tekrar dene',
          });
          return;
        }
        const apiMessages = next.filter(
          (m) => m.content.trim() && (m.role === 'user' || m.role === 'assistant'),
        );
        const data = await assistantChat({
          city,
          district,
          interests: effectiveInterests,
          messages: apiMessages,
          preferred_language: preferredLanguage,
        });
        setMsgs((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } catch (err) {
        setErrorDetail({
          kind: 'network',
          message: formatApiError(err),
          actionLabel: 'Tekrar dene',
        });
      }
    });
  };

  return (
    <section
      className="mx-auto flex h-full min-h-[calc(100dvh-10rem)] w-full max-w-3xl flex-1 flex-col gap-3 pb-2 lg:min-h-0"
      aria-labelledby="asst-title"
    >
      <BackButton />
      <header className="shrink-0 space-y-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-theme sm:text-3xl" id="asst-title">
          {t('assistant.title', 'AI Asistan')}
        </h1>
        <p className="text-sm text-theme-muted">{t('assistant.subtitle', 'Şehir/ilçe ve ilgi alanına göre öneri + mini plan')}</p>
      </header>

      {import.meta.env.DEV ? (
        <div className="shrink-0 rounded-xl border border-stone-900/10 bg-stone-50 px-3 py-2 text-xs text-stone-500 dark:border-white/10 dark:bg-zinc-900">
          Geliştirici: {getApiBaseUrl()}
        </div>
      ) : null}

      {connState === 'waking' ? (
        <div
          className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Sunucu uyanıyor… İlk bağlantı 30–60 saniye sürebilir.
        </div>
      ) : null}

      {connState === 'offline' ? (
        <div
          className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar dene.
        </div>
      ) : null}

      {errorDetail ? (
        <div className="shrink-0">
          <ErrorAlert error={errorDetail} onRetry={() => setErrorDetail(null)} />
        </div>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="theme-card rounded-2xl p-3">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted" htmlFor="asst-city">
            Şehir
          </label>
          <select
            id="asst-city"
            className="mt-1 w-full rounded-lg border border-stone-900/12 bg-white px-2 py-2 text-base text-stone-900 outline-none focus:ring-2 focus:ring-primary/40 dark:border-white/15 dark:bg-zinc-900 dark:text-stone-100 sm:text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {cities.length ? (
              cities.map((c) => (
                <option key={c.city_id} value={c.name_tr} className="bg-white text-stone-900 dark:bg-zinc-900 dark:text-stone-100">
                  {c.name_tr}
                </option>
              ))
            ) : (
              <option value={city}>{city}</option>
            )}
          </select>
        </div>
        <div className="theme-card rounded-2xl p-3">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted" htmlFor="asst-district">
            İlçe (opsiyonel)
          </label>
          <input
            id="asst-district"
            className="mt-1 w-full rounded-lg border border-stone-900/12 bg-white px-2 py-2 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-primary/40 dark:border-white/15 dark:bg-zinc-900 dark:text-stone-100 dark:placeholder:text-stone-500 sm:text-sm"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder={t('assistant.districtPlaceholder', 'e.g. Eminönü')}
          />
        </div>
      </div>

      <div className="theme-card flex min-h-[min(52dvh,480px)] flex-1 flex-col overflow-hidden rounded-2xl p-3 sm:p-4 lg:min-h-0">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {msgs.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={[
                  'max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%]',
                  m.role === 'user'
                    ? 'bg-primary text-sm leading-relaxed text-white'
                    : 'theme-card text-sm leading-relaxed',
                ].join(' ')}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                ) : (
                  <AssistantMessageBody content={m.content} linkContext={venueLinkContext} />
                )}
              </div>
            </div>
          ))}
          {sendLoading ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl theme-card px-4 py-3 text-sm text-theme-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Yazıyor…
              </div>
            </div>
          ) : null}
        </div>

        {msgs.some((m) => m.role === 'assistant' && m.content.length > 20) ? (
          <div className="shrink-0 pt-2">
            <HelpfulFeedback contextKey={`assistant_${city}`} />
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10 mt-2 flex shrink-0 items-end gap-2 border-t border-stone-900/5 bg-[var(--card-bg,theme(colors.white))] pt-3 dark:border-white/10 dark:bg-zinc-900">
          <textarea
            rows={1}
            className="max-h-32 min-h-[48px] min-w-0 flex-1 resize-none rounded-xl border border-stone-900/10 bg-white px-3 py-3 text-base leading-snug outline-none focus:border-primary dark:border-white/10 dark:bg-zinc-950 sm:text-sm"
            placeholder={t('assistant.placeholder', 'Ask a question…')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            className="tap-scale mb-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-60"
            onClick={handleSend}
            disabled={sendLoading}
            aria-busy={sendLoading}
            aria-label={t('assistant.send', 'Send')}
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
