import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

export function HelpfulFeedback({ contextKey }: { contextKey: string }): ReactElement {
  const storageKey = `hg_helpful_${contextKey}`;
  const [vote, setVote] = useState<'up' | 'down' | null>(() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v === 'up' || v === 'down' ? v : null;
    } catch {
      return null;
    }
  });

  const choose = (v: 'up' | 'down') => {
    setVote(v);
    try {
      localStorage.setItem(storageKey, v);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-900/10 bg-stone-50/80 px-4 py-3 dark:border-white/10 dark:bg-zinc-900/50">
      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Bu bilgi faydalı mıydı?</p>
      {vote ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">Teşekkürler, geri bildirimin kaydedildi.</p>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            className="tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900"
            aria-label="Evet, faydalı"
            onClick={() => choose('up')}
          >
            <ThumbsUp className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900"
            aria-label="Hayır, faydalı değil"
            onClick={() => choose('down')}
          >
            <ThumbsDown className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
