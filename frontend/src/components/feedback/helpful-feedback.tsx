import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

export function HelpfulFeedback({ contextKey }: { contextKey: string }): ReactElement | null {
  const storageKey = `hg_helpful_${contextKey}`;
  const [vote, setVote] = useState<'up' | 'down' | null>(() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v === 'up' || v === 'down' ? v : null;
    } catch {
      return null;
    }
  });

  if (vote) return null;

  const choose = (v: 'up' | 'down') => {
    setVote(v);
    try {
      localStorage.setItem(storageKey, v);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-900/10 bg-stone-50/80 px-4 py-2.5 dark:border-white/10 dark:bg-zinc-900/50">
      <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">Bu yanıt faydalı mıydı?</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="tap-scale inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900"
          aria-label="Evet, faydalı"
          onClick={() => choose('up')}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="tap-scale inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900"
          aria-label="Hayır, faydalı değil"
          onClick={() => choose('down')}
        >
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
