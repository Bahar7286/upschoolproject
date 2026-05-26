import type { LucideIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'primary' | 'amber' | 'gold';
}): ReactElement {
  const iconColor =
    accent === 'amber' ? 'text-amber-500' : accent === 'gold' ? 'text-heritage-gold' : 'text-primary';

  return (
    <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/95">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">{label}</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-heritage-ink dark:text-stone-50">{value}</p>
          {hint ? <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">{hint}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-zinc-800 ${iconColor}`}>
          <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
