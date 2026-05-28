import type { ReactElement } from 'react';
import { useEffect } from 'react';
import {
  CalendarDays,
  Compass,
  Headphones,
  Heart,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Palette,
  Settings,
  ShoppingBag,
  UserRound,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { OnboardingGate } from '../onboarding/onboarding-gate';
import { BrandLogo } from '../brand/brand-logo';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MobileHeaderMenu } from './mobile-header-menu';
import { ThemeToggle } from '../theme/theme-toggle';
import { fetchCurrentUser } from '../../services/auth-service';
import { useAuthStore } from '../../stores/auth-store';
import { useOnboardingStore } from '../../stores/onboarding-store';

function navClass(isActive: boolean): string {
  return [
    'app-nav-link inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors tap-scale focus-ring',
    isActive ? 'app-nav-link--active' : '',
  ].join(' ');
}

export function AppLayout(): ReactElement {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser(accessToken);
        if (!cancelled) {
          setUser(me);
          useOnboardingStore.getState().hydrateFromUser(me);
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
  const isAdmin = user?.role === 'admin';
  const isTourist = !isGuide && !isAdmin;

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <header className="app-header sticky top-0 z-40 border-b pt-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-8">
          <BrandLogo size="sm" className="min-w-0 shrink" />

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-1 md:flex" aria-label="Ana menü">
            {isAdmin ? (
              <NavLink className={({ isActive }) => navClass(isActive)} to="/admin">
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                Admin
              </NavLink>
            ) : isGuide ? (
              <>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/guide">
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Panel
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/guide/dogrulama">
                  <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Doğrulama
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/talepler">
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Talepler
                </NavLink>
              </>
            ) : (
              <>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/discover">
                  <Compass className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Keşfet
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/cities">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  İller
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/rehberler">
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Rehberler
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/map">
                  <MapIcon className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Harita
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/planner">
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Plan
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/talepler">
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Taleplerim
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/assistant">
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Asistan
                </NavLink>
                <NavLink className={({ isActive }) => navClass(isActive)} to="/favorites">
                  <Heart className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                  Favori
                </NavLink>
              </>
            )}
            <NavLink className={({ isActive }) => navClass(isActive)} to="/audio">
              <Headphones className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
              Ses
            </NavLink>
            {isTourist ? (
              <NavLink className={({ isActive }) => navClass(isActive)} to="/onboarding">
                <Palette className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                Gezi tercihleri
              </NavLink>
            ) : null}
            {isTourist ? (
              <NavLink className={({ isActive }) => navClass(isActive)} to="/purchases">
                <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
                Satın alımlar
              </NavLink>
            ) : null}
            <NavLink className={({ isActive }) => navClass(isActive)} to="/profile">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2} />
              Profil
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <MobileHeaderMenu isAdmin={isAdmin} isGuide={isGuide} />
            <NavLink
              className="app-chip tap-scale focus-ring hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full md:inline-flex"
              to="/profile#settings"
              aria-label="Ayarlar"
              title="Ayarlar"
            >
              <Settings className="h-5 w-5 text-theme-muted" aria-hidden="true" strokeWidth={2} />
            </NavLink>
            <ThemeToggle />
            {accessToken ? (
              <>
                <div
                  className="app-chip hidden items-center gap-2 rounded-full px-3 py-1.5 md:flex"
                  title={user?.email ?? ''}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold">
                    {initials}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-semibold text-theme">{user?.full_name ?? 'Gezgin'}</span>
                </div>
                <button
                  className="app-chip tap-scale focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 text-sm font-semibold shadow-sm"
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4 text-theme-muted" aria-hidden="true" strokeWidth={2} />
                  <span className="hidden sm:inline text-theme">Çıkış</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="app-chip tap-scale focus-ring hidden min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold sm:inline-flex sm:items-center text-theme"
                  type="button"
                  onClick={() => navigate('/login')}
                >
                  Giriş
                </button>
                <button
                  className="tap-scale focus-ring inline-flex min-h-[44px] rounded-full bg-primary px-4 text-sm font-bold shadow-sm"
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

      <main className="app-main mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-5 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-6 md:px-8 md:pb-10 lg:pb-10">
        <OnboardingGate>
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </OnboardingGate>
      </main>

      <MobileBottomNav isAdmin={isAdmin} isGuide={isGuide} />
    </div>
  );
}
