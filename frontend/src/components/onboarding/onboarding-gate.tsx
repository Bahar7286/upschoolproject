import type { ReactElement, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../stores/auth-store';

const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/onboarding',
  '/sifremi-unuttum',
  '/sifre-sifirla',
  '/terms',
  '/privacy',
  '/kvkk',
  '/cerezler',
  '/iade',
  '/rehber-guven',
  '/odeme-guvenlik',
  '/iletisim',
  '/hakkimizda',
  '/sss',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PREFIXES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => p !== '/' && pathname.startsWith(`${p}/`));
}

export function OnboardingGate({ children }: { children: ReactNode }): ReactElement {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken || !user) return <>{children}</>;

  const isTourist = user.role === 'tourist';
  const needsOnboarding = isTourist && !user.onboarding_completed;
  const onOnboarding = location.pathname === '/onboarding';

  if (needsOnboarding && !onOnboarding && !isPublicPath(location.pathname)) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  if (needsOnboarding && onOnboarding) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
