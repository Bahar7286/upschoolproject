import {
  Compass,
  Heart,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  ShoppingBag,
  UserRound,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';

type NavItem = { to: string; label: string; icon: LucideIcon };

function bottomClass(isActive: boolean): string {
  return [
    'app-bottom-link flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-bold leading-tight transition-colors tap-scale focus-ring sm:text-[11px]',
    isActive ? 'app-bottom-link--active' : '',
  ].join(' ');
}

function NavItems({ items }: { items: NavItem[] }): ReactElement {
  return (
    <>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} className={({ isActive }) => bottomClass(isActive)} to={to} end={to === '/profile'}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" strokeWidth={2} />
          <span className="max-w-[4.5rem] truncate text-center">{label}</span>
        </NavLink>
      ))}
    </>
  );
}

/** Mobil: en fazla 5 sekme — geri kalanlar masaüstü menüde */
const TOURIST_NAV: NavItem[] = [
  { to: '/discover', label: 'Keşfet', icon: Compass },
  { to: '/cities', label: 'İller', icon: MapPin },
  { to: '/map', label: 'Harita', icon: MapIcon },
  { to: '/assistant', label: 'Asistan', icon: MessageCircle },
  { to: '/profile', label: 'Profil', icon: UserRound },
];

const GUIDE_NAV: NavItem[] = [
  { to: '/guide', label: 'Panel', icon: LayoutDashboard },
  { to: '/cities', label: 'İller', icon: MapPin },
  { to: '/assistant', label: 'Asistan', icon: MessageCircle },
  { to: '/talepler', label: 'Talepler', icon: ShoppingBag },
  { to: '/guide/dogrulama', label: 'Doğrulama', icon: UserRound },
  { to: '/profile', label: 'Profil', icon: UserRound },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Admin', icon: LayoutDashboard },
  { to: '/discover', label: 'Keşfet', icon: Compass },
  { to: '/cities', label: 'İller', icon: MapPin },
  { to: '/assistant', label: 'Asistan', icon: MessageCircle },
  { to: '/favorites', label: 'Favori', icon: Heart },
  { to: '/rehberler', label: 'Rehberler', icon: Users },
  { to: '/profile', label: 'Profil', icon: UserRound },
];

export function MobileBottomNav({
  isAdmin,
  isGuide,
}: {
  isAdmin: boolean;
  isGuide: boolean;
}): ReactElement {
  const items = isAdmin ? ADMIN_NAV : isGuide ? GUIDE_NAV : TOURIST_NAV;

  return (
    <nav
      className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex w-full max-w-[100vw] gap-0 border-t px-1 pb-[calc(8px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
      aria-label="Mobil menü"
    >
      <NavItems items={items} />
    </nav>
  );
}
