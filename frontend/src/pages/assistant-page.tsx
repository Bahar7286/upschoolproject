import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { assistantChat, type AssistantMessage } from '../services/ai-service';
import { formatApiError } from '../lib/api';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';

export default function AssistantPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const interests = useOnboardingStore((s) => s.interests);
  const effectiveInterests = useMemo(
    () => (interests.length ? interests : user?.interests?.length ? user.interests : ['history', 'art', 'food']),
    [interests, user],
  );

  const [city, setCity] = useState('Istanbul');
  const [district, setDistrict] = useState('');
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content: 'Merhaba! Şehir/ilçe ve ilgi alanına göre plan yapabilirim. Nereye gideceksin, kaç günün var?',
    },
  ]);
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: async (messages: AssistantMessage[]) => {
      return assistantChat({
        city,
        district,
        interests: effectiveInterests,
        messages,
      });
    },
    onSuccess: (data) => {
      setMsgs((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    },
    onError: (err) => setError(formatApiError(err)),
  });

  const handleSend = async () => {
    setError('');
    const text = input.trim();
    if (!text) return;

    const next = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setInput('');
    mut.mutate(next);
  };

  return (
    <section className="mx-auto max-w-3xl space-y-4" aria-labelledby="asst-title">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="asst-title">
          AI Asistan
        </h1>
        <p className="text-sm text-theme-muted">Şehir/ilçe ve ilgi alanına göre öneri + mini plan</p>
      </header>

      {error ? (
        <p className="alert-error rounded-xl px-3 py-2 text-sm font-semibold" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="theme-card rounded-2xl p-3">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">Şehir</label>
          <input className="mt-1 w-full bg-transparent text-sm outline-none" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="theme-card rounded-2xl p-3">
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">İlçe (opsiyonel)</label>
          <input
            className="mt-1 w-full bg-transparent text-sm outline-none"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>
      </div>

      <div className="theme-card flex min-h-[55vh] flex-col gap-3 rounded-2xl p-4">
        <div className="flex-1 space-y-3 overflow-auto pr-1">
          {msgs.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={[
                  'max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-stone-50',
                ].join(' ')}
              >
                {m.content}
              </div>
            </div>
          ))}
          {mut.isPending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700 dark:bg-zinc-800 dark:text-stone-200">
                Yazıyor…
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="h-12 flex-1 rounded-xl border border-stone-900/10 bg-white px-4 text-sm outline-none dark:border-white/10 dark:bg-zinc-900"
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
            className="tap-scale inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-60"
            onClick={handleSend}
            disabled={mut.isPending}
            aria-label="Gönder"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

