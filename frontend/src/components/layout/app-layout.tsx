import type { ReactElement } from 'react';
import { useEffect } from 'react';
import {
  Compass,
  Headphones,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Palette,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '../theme/theme-toggle';
import { fetchCurrentUser } from '../../services/auth-service';
import { useAuthStore } from '../../stores/auth-store';

function navClass(isActive: boolean): string {
  return [
    'inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-amber-500/15 text-heritage-ink dark:bg-amber-400/15 dark:text-stone-50'
      : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-300 dark:hover:bg-white/5',
  ].join(' ');
}

function bottomClass(isActive: boolean): string {
  return [
    'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition-colors tap-scale',
    isActive
      ? 'bg-amber-500/20 text-heritage-ink dark:bg-amber-400/15 dark:text-amber-200'
      : 'text-stone-500 dark:text-stone-400',
  ].join(' ');
}

export function AppLayout(): ReactElement {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser(accessToken);
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          logout();
          navigate('/login', { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, logout, navigate, setUser]);

  const initials =
    user?.full_name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'HG';

  const isGuide = user?.role === 'guide';

  return (
    <div className="app-shell heritage-bg min-h-dvh bg-[#ebe4d8] text-stone-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-stone-100">
      <header className="app-header border-b border-stone-900/10 bg-[rgb(244_240_232/0.88)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(15_23_42/0.82)]">
        <div className="app-header__inner">
          <NavLink className="app-brand tap-scale" to="/discover" aria-label="Historial-GO ana sayfa">
            <span className="app-brand__mark" aria-hidden="true" />
            <span className="app-brand__text dark:text-stone-50">Historial-GO</span>
          </NavLink>

          <nav className="app-nav app-nav--desktop max-w-[52rem] flex-1 justify-center" aria-label="Ana menü">
            <NavLink className={({ isActive }) => navClass(isActive)} to="/discover">
              <Compass className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
              Keşfet
            </NavLink>
            <NavLink className={({ isActive }) => navClass(isActive)} to="/map">
              <MapIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
              Harita
            </NavLink>
            <NavLink className={({ isActive }) => navClass(isActive)} to="/audio">
              <Headphones className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
              Sesli rehber
            </NavLink>
            <NavLink className={({ isActive }) => navClass(isActive)} to="/onboarding">
              <Palette className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
              İlgi alanları
            </NavLink>
            {isGuide ? (
              <NavLink className={({ isActive }) => navClass(isActive)} to="/guide">
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
                Rehber paneli
              </NavLink>
            ) : null}
            <NavLink className={({ isActive }) => navClass(isActive)} to="/purchases">
              <ShoppingBag className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
              Satın alımlar
            </NavLink>
            <NavLink className={({ isActive }) => navClass(isActive)} to="/profile">
              <UserRound className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" strokeWidth={2} />
              Profil
            </NavLink>
          </nav>

          <div className="app-header__actions flex items-center gap-2">
            <ThemeToggle />
            {accessToken ? (
              <>
                <div
                  className="app-user-chip hidden border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900 md:flex"
                  title={user?.email ?? ''}
                >
                  <span className="app-user-chip__avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="app-user-chip__name dark:text-stone-100">{user?.full_name ?? 'Gezgin'}</span>
                </div>
                <button
                  className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-900/10 bg-white/90 px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100 dark:hover:bg-zinc-800"
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="tap-scale hidden min-h-[44px] rounded-full border-2 border-stone-300 bg-transparent px-4 py-2 text-sm font-semibold text-stone-900 hover:border-stone-900 dark:border-zinc-600 dark:text-stone-100 dark:hover:border-white sm:inline-flex sm:items-center"
                  type="button"
                  onClick={() => navigate('/login')}
                >
                  Giriş
                </button>
                <button
                  className="tap-scale inline-flex min-h-[44px] items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                  type="button"
                  onClick={() => navigate('/register')}
                >
                  Kayıt
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="app-main flex-1">
        <div className="app-main__inner animate-fade-in-up">
          <Outlet />
        </div>
      </main>

      <nav
        className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 gap-0 border-t border-stone-900/10 bg-[rgb(244_240_232/0.92)] px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(15_23_42/0.92)] md:hidden"
        aria-label="Mobil menü"
      >
        <NavLink className={({ isActive }) => bottomClass(isActive)} to="/discover">
          <Compass className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          Keşfet
        </NavLink>
        <NavLink className={({ isActive }) => bottomClass(isActive)} to="/map">
          <MapIcon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          Harita
        </NavLink>
        <NavLink className={({ isActive }) => bottomClass(isActive)} to="/purchases">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          Satın alımlar
        </NavLink>
        <NavLink className={({ isActive }) => bottomClass(isActive)} to="/profile">
          <UserRound className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          Profil
        </NavLink>
      </nav>
    </div>
  );
}
