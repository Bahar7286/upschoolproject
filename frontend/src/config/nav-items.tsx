import {
  CalendarDays,
  Compass,
  Heart,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Palette,
  ShoppingBag,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

import { useI18n } from '../lib/i18n';

export type NavItem = { to: string; label: string; icon: LucideIcon };

export function useTouristBottomNav(): NavItem[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { to: '/discover', label: t('nav.discover', 'Keşfet'), icon: Compass },
      { to: '/cities', label: t('nav.cities', 'İller'), icon: MapPin },
      { to: '/map', label: t('nav.map', 'Harita'), icon: MapIcon },
      { to: '/assistant', label: t('nav.assistant', 'Asistan'), icon: MessageCircle },
    ],
    [t],
  );
}

export function useGuideBottomNav(): NavItem[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { to: '/guide', label: t('nav.panel', 'Panel'), icon: LayoutDashboard },
      { to: '/cities', label: t('nav.cities', 'İller'), icon: MapPin },
      { to: '/assistant', label: t('nav.assistant', 'Asistan'), icon: MessageCircle },
      { to: '/talepler', label: t('nav.trips', 'Talepler'), icon: ShoppingBag },
    ],
    [t],
  );
}

export function useAdminBottomNav(): NavItem[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { to: '/admin', label: t('nav.admin', 'Admin'), icon: LayoutDashboard },
      { to: '/discover', label: t('nav.discover', 'Keşfet'), icon: Compass },
      { to: '/cities', label: t('nav.cities', 'İller'), icon: MapPin },
      { to: '/assistant', label: t('nav.assistant', 'Asistan'), icon: MessageCircle },
    ],
    [t],
  );
}

export function useTouristMobileMenuExtras(): NavItem[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { to: '/rehberler', label: t('nav.guides', 'Rehberler'), icon: Users },
      { to: '/planner', label: t('nav.plan', 'Plan'), icon: CalendarDays },
      { to: '/talepler', label: t('nav.trips', 'Taleplerim'), icon: ShoppingBag },
      { to: '/favorites', label: t('nav.favorites', 'Favoriler'), icon: Heart },
      { to: '/purchases', label: t('nav.purchases', 'Satın alımlar'), icon: Wallet },
      { to: '/onboarding', label: t('nav.interests', 'İlgi alanları'), icon: Palette },
    ],
    [t],
  );
}

export function useAdminMobileMenuExtras(): NavItem[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { to: '/discover', label: t('nav.discover', 'Keşfet'), icon: Compass },
      { to: '/map', label: t('nav.map', 'Harita'), icon: MapIcon },
      { to: '/rehberler', label: t('nav.guides', 'Rehberler'), icon: Users },
      { to: '/profile', label: t('nav.profile', 'Profil'), icon: UserRound },
    ],
    [t],
  );
}

export function useGuideMobileMenuExtras(): NavItem[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { to: '/guide/dogrulama', label: t('nav.verification', 'Doğrulama'), icon: UserRound },
      { to: '/cities', label: t('nav.cities', 'İller'), icon: MapPin },
      { to: '/map', label: t('nav.map', 'Harita'), icon: MapIcon },
      { to: '/profile', label: t('nav.profile', 'Profil'), icon: UserRound },
    ],
    [t],
  );
}

export function useRoleBottomNav(isAdmin: boolean, isGuide: boolean): NavItem[] {
  const tourist = useTouristBottomNav();
  const guide = useGuideBottomNav();
  const admin = useAdminBottomNav();
  if (isAdmin) return admin;
  if (isGuide) return guide;
  return tourist;
}
