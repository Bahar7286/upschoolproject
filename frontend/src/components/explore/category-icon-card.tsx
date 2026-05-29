import type { LucideIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type CategoryIconCardProps = {
  to: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  emoji?: string;
  children?: ReactNode;
};

export function CategoryIconCard({
  to,
  label,
  description,
  icon: Icon,
  emoji,
}: CategoryIconCardProps): ReactElement {
  return (
    <Link
      to={to}
      className="tap-scale flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-stone-900/10 bg-white px-3 py-4 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900"
    >
      {emoji ? (
        <span className="text-2xl" aria-hidden="true">
          {emoji}
        </span>
      ) : Icon ? (
        <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
      ) : null}
      <span className="text-sm font-semibold text-theme">{label}</span>
      {description ? <span className="text-xs text-theme-muted">{description}</span> : null}
    </Link>
  );
}
