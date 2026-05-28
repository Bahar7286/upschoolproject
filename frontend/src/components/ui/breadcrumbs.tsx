import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}): ReactElement {
  return (
    <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-stone-600 dark:text-stone-400" aria-label="Sayfa konumu">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex min-w-0 items-center gap-1">
          {i > 0 ? <span aria-hidden="true">/</span> : null}
          {item.to ? (
            <Link className="shrink-0 font-semibold hover:text-primary hover:underline" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span className="min-w-0 truncate font-medium text-stone-800 dark:text-stone-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
