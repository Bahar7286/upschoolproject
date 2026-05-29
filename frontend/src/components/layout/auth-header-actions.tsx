import { LogOut } from 'lucide-react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '../../lib/i18n';
import { useAuthStore } from '../../stores/auth-store';

export function AuthHeaderActions({
  accessToken,
  userName,
  initials,
}: {
  accessToken: string | null;
  userName?: string;
  initials: string;
}): ReactElement {
  const { t } = useI18n();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  if (accessToken) {
    return (
      <>
        <div
          className="app-chip hidden items-center gap-2 rounded-full px-3 py-1.5 md:flex"
          title={userName ?? ''}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </span>
          <span className="max-w-[120px] truncate text-sm font-semibold text-theme">{userName ?? t('auth.traveler', 'Gezgin')}</span>
        </div>
        <button
          className="app-chip tap-scale focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold shadow-sm sm:gap-2 sm:px-3"
          type="button"
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
        >
          <LogOut className="h-4 w-4 text-theme-muted" aria-hidden="true" strokeWidth={2} />
          <span className="text-theme">{t('auth.logout', 'Çıkış')}</span>
        </button>
      </>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        className="app-chip tap-scale focus-ring inline-flex min-h-[44px] items-center justify-center rounded-full border-2 px-2.5 text-xs font-semibold text-theme sm:px-4 sm:text-sm"
        type="button"
        onClick={() => navigate('/login')}
      >
        {t('auth.login', 'Giriş')}
      </button>
      <button
        className="tap-scale focus-ring inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-2.5 text-xs font-bold text-white shadow-sm sm:px-4 sm:text-sm"
        type="button"
        onClick={() => navigate('/register')}
      >
        {t('auth.register', 'Kayıt')}
      </button>
    </div>
  );
}
