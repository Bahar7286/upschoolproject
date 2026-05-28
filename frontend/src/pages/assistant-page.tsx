import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BackButton } from '../components/ui/back-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { assistantChat, fetchAiStatus, type AssistantMessage } from '../services/ai-service';
import { listCities } from '../services/city-service';
import { HelpfulFeedback } from '../components/feedback/helpful-feedback';
import { ErrorAlert } from '../components/ui/error-alert';
import { getApiBaseUrl } from '../lib/api';
import { mapError } from '../lib/user-errors';
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

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: fetchAiStatus,
    staleTime: 60_000,
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
      content: 'Merhaba! Şehir/ilçe ve ilgi alanına göre plan yapabilirim. Nereye gideceksin, kaç günün var?',
    },
  ]);
  const [error, setError] = useState('');

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
    setError('');
    const text = input.trim();
    if (!text) return;
    const next: AssistantMessage[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setInput('');
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
        setError(mapError(err, 'assistant').message);
      }
    });
  };

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4 pb-4" aria-labelledby="asst-title">
      <BackButton to="/discover" />
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-theme sm:text-3xl" id="asst-title">
          AI Asistan
        </h1>
        <p className="text-sm text-theme-muted">Şehir/ilçe ve ilgi alanına göre öneri + mini plan</p>
      </header>

      <div className="rounded-xl border border-stone-900/10 bg-stone-50 px-3 py-2 text-xs text-stone-600 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-400">
        API: {getApiBaseUrl()}
        {aiStatus ? (
          <>
            {' '}
            · LLM: {aiStatus.llm_enabled ? `açık (${aiStatus.provider})` : 'kapalı — Render’da OPENROUTER_API_KEY gerekli'}
          </>
        ) : null}
      </div>

      {error ? (
        <ErrorAlert error={mapError(new Error(error), 'assistant')} onRetry={() => setError('')} />
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="theme-card rounded-2xl p-3">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted" htmlFor="asst-city">
            Şehir
          </label>
          <select
            id="asst-city"
            className="mt-1 w-full bg-transparent text-sm outline-none"
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
            className="mt-1 w-full bg-transparent text-sm outline-none"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Örn. Eminönü"
          />
        </div>
      </div>

      <div className="theme-card flex min-h-[50vh] max-h-[min(70vh,520px)] flex-col gap-3 rounded-2xl p-3 sm:p-4">
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {msgs.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={[
                  'max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%]',
                  m.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-stone-50',
                ].join(' ')}
              >
                {m.content}
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
          <HelpfulFeedback contextKey={`assistant_${city}`} />
        ) : null}

        <div className="flex shrink-0 items-center gap-2 border-t border-stone-900/5 pt-2 dark:border-white/10">
          <input
            className="h-12 min-w-0 flex-1 rounded-xl border border-stone-900/10 bg-white px-3 text-base outline-none dark:border-white/10 dark:bg-zinc-900 sm:px-4 sm:text-sm"
            placeholder="Mesaj yaz…"
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
            className="tap-scale inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-60"
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
