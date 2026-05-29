import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';

import { useRoleBottomNav } from '../../config/nav-items';

function bottomClass(isActive: boolean): string {
  return [
    'app-bottom-link flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-bold leading-tight transition-colors tap-scale focus-ring sm:text-[11px]',
    isActive ? 'app-bottom-link--active' : '',
  ].join(' ');
}

export function MobileBottomNav({
  isAdmin,
  isGuide,
}: {
  isAdmin: boolean;
  isGuide: boolean;
}): ReactElement {
  const items = useRoleBottomNav(isAdmin, isGuide);

  return (
    <nav
      className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex w-full max-w-[100vw] flex-nowrap gap-0 border-t px-1 pb-[calc(8px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
      aria-label="Mobil menü"
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} className={({ isActive }) => bottomClass(isActive)} to={to}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" strokeWidth={2} />
          <span className="max-w-[4.5rem] truncate text-center">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
