import { Star } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Button } from '../ui/button';

const STORAGE_KEY = 'hg_route_nps';

export function RouteRecommendNps({ routeId, routeTitle }: { routeId: number; routeTitle: string }): ReactElement {
  const [score, setScore] = useState<number | null>(null);
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_${routeId}`) != null;
    } catch {
      return false;
    }
  });

  if (done) {
    return (
      <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-stone-700 dark:text-stone-300" role="status">
        Geri bildirimin için teşekkürler!
      </p>
    );
  }

  const submit = (value: number) => {
    setScore(value);
    try {
      localStorage.setItem(`${STORAGE_KEY}_${routeId}`, String(value));
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  return (
    <section
      className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95"
      aria-labelledby="nps-title"
    >
      <h2 className="font-display text-lg font-bold text-heritage-ink dark:text-stone-50" id="nps-title">
        Bu rotayı başkasına önerir misin?
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{routeTitle}</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Öneri puanı 1-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`tap-scale min-h-[44px] min-w-[44px] rounded-xl border-2 font-bold transition ${
              score === n
                ? 'border-primary bg-primary text-white'
                : 'border-stone-900/10 hover:border-primary/50 dark:border-white/10'
            }`}
            aria-label={`${n} puan`}
            onClick={() => submit(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
        <Star className="h-3.5 w-3.5" aria-hidden="true" />
        1 = hayır, 5 = kesinlikle öneririm
      </p>
      {score != null && !done ? (
        <Button className="mt-3" type="button" onClick={() => setDone(true)}>
          Gönder
        </Button>
      ) : null}
    </section>
  );
}
