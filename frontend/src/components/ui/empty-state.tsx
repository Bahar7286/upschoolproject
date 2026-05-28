import type { LucideIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ButtonLink } from './button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <div className="theme-card rounded-2xl px-6 py-10 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800">
          <Icon className="h-7 w-7 text-stone-500" aria-hidden="true" />
        </div>
      ) : null}
      <h2 className="font-display text-lg font-bold text-theme">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-theme-muted">{description}</p>
      {children}
      {actionLabel && actionTo ? (
        <ButtonLink className="mt-5" to={actionTo}>
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
