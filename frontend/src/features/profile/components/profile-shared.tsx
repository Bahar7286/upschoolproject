import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../../lib/i18n';

export function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-stone-900/10 bg-white p-3 text-center dark:border-white/10 dark:bg-zinc-900 sm:p-4">
      <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
      <p className="mt-2 text-lg font-bold text-stone-900 dark:text-stone-50 sm:text-xl">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-stone-600 dark:text-stone-300 sm:text-xs">{label}</p>
    </div>
  );
}

export function SectionTitle({ title }: { title: string }): ReactElement {
  return <h2 className="font-display text-lg font-bold text-theme">{title}</h2>;
}

export function EmptyHint({
  text,
  link,
  linkLabel,
}: {
  text: string;
  link?: string;
  linkLabel?: string;
}): ReactElement {
  return (
    <p className="theme-card rounded-xl border border-dashed px-4 py-6 text-center text-sm text-theme-muted">
      {text}
      {link ? (
        <>
          {' '}
          <Link className="font-bold text-primary hover:underline" to={link}>
            {linkLabel}
          </Link>
        </>
      ) : null}
    </p>
  );
}

export function HistoryRow({
  title,
  subtitle,
  routeId,
  routeTitle,
}: {
  title: string;
  subtitle: string;
  routeId: number | null;
  routeTitle?: string;
}): ReactElement {
  const { t } = useI18n();
  return (
    <li className="theme-card flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-theme">{title}</p>
        <p className="truncate text-xs text-theme-muted">{subtitle}</p>
        {routeTitle ? <p className="truncate text-xs text-primary">{routeTitle}</p> : null}
      </div>
      {routeId != null ? (
        <Link className="shrink-0 text-sm font-bold text-primary hover:underline" to={`/routes/${routeId}`}>
          {t('common.open', 'Aç')}
        </Link>
      ) : null}
    </li>
  );
}
