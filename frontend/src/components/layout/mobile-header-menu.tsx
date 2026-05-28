import {
  CalendarDays,
  Compass,
  Headphones,
  Heart,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageCircle,
  ShoppingBag,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

type Item = { to: string; label: string; icon: LucideIcon };

const TOURIST_EXTRA: Item[] = [
  { to: '/rehberler', label: 'Rehberler', icon: Users },
  { to: '/planner', label: 'Plan', icon: CalendarDays },
  { to: '/talepler', label: 'Taleplerim', icon: ShoppingBag },
  { to: '/favorites', label: 'Favoriler', icon: Heart },
  { to: '/audio', label: 'Sesli rehber', icon: Headphones },
  { to: '/purchases', label: 'Satın alımlar', icon: Wallet },
  { to: '/onboarding', label: 'İlgi alanları', icon: Compass },
];

function linkClass(isActive: boolean): string {
  return [
    'flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors',
    isActive ? 'bg-primary/15 text-primary' : 'text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-zinc-800',
  ].join(' ');
}

export function MobileHeaderMenu({
  isAdmin,
  isGuide,
}: {
  isAdmin: boolean;
  isGuide: boolean;
}): ReactElement {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isAdmin || isGuide) return <span className="md:hidden" />;

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-900/10 bg-white/80 dark:border-white/10 dark:bg-zinc-900"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[65] bg-black/40"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav-drawer"
            className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-3rem,320px)] flex-col gap-1 overflow-y-auto border-l border-stone-900/10 bg-white p-4 pt-safe shadow-xl dark:border-white/10 dark:bg-zinc-950"
            aria-label="Mobil menü"
          >
            <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-stone-500">Menü</p>
            {TOURIST_EXTRA.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} className={({ isActive }) => linkClass(isActive)} to={to} onClick={() => setOpen(false)}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  );
}
