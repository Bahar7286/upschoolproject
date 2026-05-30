import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getQuickAssistantReply } from '../lib/assistant-intent';
import { AssistantMessageBody } from '../components/ai/assistant-message-body';
import { BackButton } from '../components/ui/back-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { assistantChat, type AssistantMessage } from '../services/ai-service';
import { listCities } from '../services/city-service';
import { HelpfulFeedback } from '../components/feedback/helpful-feedback';
import { ErrorAlert } from '../components/ui/error-alert';
import { getApiBaseUrl } from '../lib/api';
import { mapError, type UserFacingError } from '../lib/user-errors';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';

export default function AssistantPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const interests = useOnboardingStore((s) => s.interests);
  const [searchParams] = useSearchParams();
  const effectiveInterests = useMemo(
    () => (interests.length ? interests : user?.interests?.length ? user.interests : ['history', 'art', 'food']),
    [interests, user],
  );

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const initialCity = searchParams.get('city') ?? 'İstanbul';
  const initialDistrict = searchParams.get('district') ?? '';
  const [city, setCity] = useState(initialCity);
  const [district, setDistrict] = useState(initialDistrict);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<AssistantMessage[]>(() => [
    {
      role: 'assistant' as const,
      content:
        'Merhaba! 👋 Ben Historial-GO AI asistanınızım. Tarihi ve kültürel yerler hakkında sorularınızı yanıtlayabilirim. Nereye gideceksiniz, kaç gününüz var?',
    },
  ]);
  const [errorDetail, setErrorDetail] = useState<UserFacingError | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

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
        const apiMessages = next.filter(
          (m) => m.content.trim() && (m.role === 'user' || m.role === 'assistant'),
        );
        const data = await assistantChat({
          city,
          district,
          interests: effectiveInterests,
          messages: apiMessages,
          location_lat: coords?.lat,
          location_lng: coords?.lng,
        });
        setMsgs((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } catch (err) {
        setErrorDetail(mapError(err, 'assistant'));
      }
    });
  };

  return (
    <section
      className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-3 pb-2"
      aria-labelledby="asst-title"
    >
      <BackButton to="/discover" />
      <header className="shrink-0 space-y-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-theme sm:text-3xl" id="asst-title">
          AI Asistan
        </h1>
        <p className="text-sm text-theme-muted">Şehir/ilçe ve ilgi alanına göre öneri + mini plan</p>
      </header>

      {import.meta.env.DEV ? (
        <div className="shrink-0 rounded-xl border border-stone-900/10 bg-stone-50 px-3 py-2 text-xs text-stone-500 dark:border-white/10 dark:bg-zinc-900">
          Geliştirici: {getApiBaseUrl()}
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
            className="mt-1 w-full bg-transparent text-base outline-none sm:text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {cities.length ? (
              cities.map((c) => (
                <option key={c.city_id} value={c.name_tr}>
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
            className="mt-1 w-full bg-transparent text-base outline-none sm:text-sm"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Örn. Eminönü"
          />
        </div>
      </div>

      <div className="theme-card flex min-h-[min(52dvh,480px)] flex-1 flex-col overflow-hidden rounded-2xl p-3 sm:min-h-[min(58dvh,560px)] sm:p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {msgs.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={[
                  'max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%]',
                  m.role === 'user'
                    ? 'bg-primary text-sm leading-relaxed text-white'
                    : 'bg-stone-100 dark:bg-zinc-800',
                ].join(' ')}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                ) : (
                  <AssistantMessageBody content={m.content} />
                )}
              </div>
            </div>
          ))}
          {sendLoading ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700 dark:bg-zinc-800 dark:text-stone-200">
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
            placeholder="Soru sor…"
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
            aria-label="Gönder"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
