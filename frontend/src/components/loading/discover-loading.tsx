import { Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';

export function DiscoverLoading({ message = 'Sana uygun rotalar hazırlanıyor…' }: { message?: string }): ReactElement {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 dark:border-primary/35 dark:bg-primary/10"
      role="status"
      aria-live="polite"
    >
      <Sparkles className="h-5 w-5 shrink-0 animate-pulse text-primary" aria-hidden="true" />
      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{message}</p>
    </div>
  );
}
