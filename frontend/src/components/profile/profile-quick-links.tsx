import { Heart, Map, Settings, ShoppingBag } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../lib/i18n';

export function ProfileQuickLinks(): ReactElement {
  const { t } = useI18n();
  const links = [
    { to: '/purchases', label: t('nav.purchases', 'Satın alımlar'), icon: ShoppingBag },
    { to: '/favorites', label: t('nav.favorites', 'Favoriler'), icon: Heart },
    { to: '/discover', label: t('profile.exploreRoutes', 'Rotaları keşfet'), icon: Map },
    { to: '/profile#settings', label: t('profile.accountSettings', 'Hesap ayarları'), icon: Settings },
  ] as const;

  return (
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t('profile.quickLinks', 'Hesap kısayolları')}>
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="tap-scale theme-card flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center text-sm font-bold text-theme"
        >
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
