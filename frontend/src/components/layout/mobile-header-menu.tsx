import { Menu, X } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';

import {
  useAdminMobileMenuExtras,
  useGuideMobileMenuExtras,
  useTouristMobileMenuExtras,
} from '../../config/nav-items';
import { useI18n } from '../../lib/i18n';

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
  const { t } = useI18n();
  const touristExtras = useTouristMobileMenuExtras();
  const guideExtras = useGuideMobileMenuExtras();
  const adminExtras = useAdminMobileMenuExtras();
  const extras = useMemo(() => {
    if (isAdmin) return adminExtras;
    if (isGuide) return guideExtras;
    return touristExtras;
  }, [isAdmin, isGuide, adminExtras, guideExtras, touristExtras]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const drawer =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[100] bg-black/40"
              aria-label={t('nav.menuClose', 'Menüyü kapat')}
              onClick={() => setOpen(false)}
            />
            <nav
              id="mobile-nav-drawer"
              className="fixed inset-y-0 right-0 z-[110] flex w-[min(100vw-3rem,320px)] flex-col gap-1 overflow-y-auto overscroll-contain border-l border-stone-900/10 bg-white p-4 pt-safe shadow-xl dark:border-white/10 dark:bg-zinc-950"
              aria-label={t('nav.menu', 'Mobil menü')}
            >
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                {t('nav.menu', 'Menü')}
              </p>
              <NavLink
                className={({ isActive }) => linkClass(isActive)}
                to="/profile"
                onClick={() => setOpen(false)}
              >
                {t('nav.profile', 'Profil')}
              </NavLink>
              {extras.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  className={({ isActive }) => linkClass(isActive)}
                  to={to}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="tap-scale inline-flex shrink-0 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-900/10 bg-white/80 md:hidden dark:border-white/10 dark:bg-zinc-900"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        aria-label={open ? t('nav.menuClose', 'Menüyü kapat') : t('nav.menuOpen', 'Menüyü aç')}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {drawer}
    </>
  );
}
