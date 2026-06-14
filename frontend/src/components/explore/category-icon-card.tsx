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
      className="tap-scale flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-stone-900/10 bg-white px-3 py-4 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:min-h-[104px] sm:px-4"
    >
      {emoji ? (
        <span className="text-2xl sm:text-3xl" aria-hidden="true">
          {emoji}
        </span>
      ) : Icon ? (
        <Icon className="h-7 w-7 text-primary sm:h-8 sm:w-8" aria-hidden="true" />
      ) : null}
      <span className="text-sm font-bold text-theme sm:text-base">{label}</span>
      {description ? (
        <span className="line-clamp-2 text-[11px] leading-snug text-theme-muted sm:text-xs">{description}</span>
      ) : null}
    </Link>
  );
}
