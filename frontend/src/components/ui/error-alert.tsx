import type { ReactElement } from 'react';

import type { UserFacingError } from '../../lib/user-errors';
import { ButtonLink } from './button';

export function ErrorAlert({
  error,
  onRetry,
}: {
  error: UserFacingError;
  onRetry?: () => void;
}): ReactElement {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/35 dark:bg-red-950/40"
      role="alert"
    >
      <p className="text-sm font-semibold text-red-900 dark:text-red-100">{error.message}</p>
      {error.alternative ? (
        <p className="mt-1 text-sm text-red-800/90 dark:text-red-200/90">{error.alternative}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry ? (
          <button
            type="button"
            className="tap-scale min-h-[44px] rounded-lg bg-red-800 px-4 text-sm font-bold text-white hover:bg-red-900 dark:bg-red-700"
            onClick={onRetry}
          >
            Tekrar dene
          </button>
        ) : null}
        {error.actionLabel && error.actionTo ? (
          <ButtonLink variant="secondary" to={error.actionTo}>
            {error.actionLabel}
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
