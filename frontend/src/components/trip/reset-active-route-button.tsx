import { RotateCcw } from 'lucide-react';
import type { ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useI18n } from '../../lib/i18n';
import { useActiveRouteStore } from '../../stores/active-route-store';

type Props = {
  className?: string;
  variant?: 'inline' | 'bar';
};

export function ResetActiveRouteButton({ className = '', variant = 'inline' }: Props): ReactElement | null {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const routeId = useActiveRouteStore((s) => s.routeId);
  const clearActiveRoute = useActiveRouteStore((s) => s.clearActiveRoute);

  if (!routeId) return null;

  const handleReset = () => {
    clearActiveRoute();
    const params = new URLSearchParams(location.search);
    params.delete('route');
    params.delete('active');
    params.delete('polyline');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  if (variant === 'bar') {
    return (
      <div
        className={`flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
          {t('map.activeRoute', 'Aktif rota')}: #{routeId}
        </p>
        <button
          type="button"
          className="tap-scale responsive-btn rounded-xl border-2 border-stone-400 px-4 text-sm font-semibold hover:border-stone-900 dark:border-zinc-500"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('map.resetRoute', 'Rotayı sıfırla')}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`tap-scale inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-stone-400 px-4 text-sm font-semibold hover:border-stone-900 dark:border-zinc-500 ${className}`}
      onClick={handleReset}
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      {t('map.resetRoute', 'Rotayı sıfırla')}
    </button>
  );
}
