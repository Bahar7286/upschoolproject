import { BadgeCheck } from 'lucide-react';
import type { ReactElement } from 'react';

export function VerifiedGuideBadge({ compact = false }: { compact?: boolean }): ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/15 font-bold text-primary-dark dark:text-primary ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      title="T.C. kokart doğrulaması — platform incelemesi"
    >
      <BadgeCheck className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      Onaylı rehber
    </span>
  );
}
