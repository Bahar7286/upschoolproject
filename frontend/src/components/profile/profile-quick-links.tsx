import { Heart, Map, Settings, ShoppingBag } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/purchases', label: 'Satın alımlar', icon: ShoppingBag },
  { to: '/favorites', label: 'Favoriler', icon: Heart },
  { to: '/discover', label: 'Rotaları keşfet', icon: Map },
  { to: '/profile#settings', label: 'Hesap ayarları', icon: Settings },
] as const;

export function ProfileQuickLinks(): ReactElement {
  return (
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Hesap kısayolları">
      {LINKS.map(({ to, label, icon: Icon }) => (
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
