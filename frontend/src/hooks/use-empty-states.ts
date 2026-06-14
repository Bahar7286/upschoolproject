import { useMemo } from 'react';
import { Bell, Heart, Map, MessageSquare, Route, Search, ShoppingBag } from 'lucide-react';

import type { EmptyStateCopy } from '../content/empty-states';
import { useI18n } from '../lib/i18n';

export function useEmptyStates(): Record<string, EmptyStateCopy> {
  const { t } = useI18n();

  return useMemo(
    () => ({
      favorites: {
        icon: Heart,
        title: t('empty.favorites.title', 'Henüz favori rotan yok'),
        description: t('empty.favorites.description', 'Beğendiğin rotaları kaydederek burada görebilirsin.'),
        actionLabel: t('empty.favorites.action', 'Rotaları Keşfet'),
        actionTo: '/discover',
      },
      purchases: {
        icon: ShoppingBag,
        title: t('empty.purchases.title', 'Henüz satın alınan rota yok'),
        description: t('empty.purchases.description', 'Sesli rehberli rotaları satın aldığında burada listelenir.'),
        actionLabel: t('empty.purchases.action', 'Rotaları Keşfet'),
        actionTo: '/discover',
      },
      reviews: {
        icon: MessageSquare,
        title: t('empty.reviews.title', 'Henüz yorum yok'),
        description: t('empty.reviews.description', 'Bu rotayı gezdikten sonra ilk yorumu sen yazabilirsin.'),
        actionLabel: t('empty.reviews.action', 'Rotayı incele'),
        actionTo: '/discover',
      },
      search: {
        icon: Search,
        title: t('empty.search.title', 'Arama sonucu bulunamadı'),
        description: t('empty.search.description', 'Farklı anahtar kelimeler veya daha geniş filtreler dene.'),
        actionLabel: t('empty.search.action', 'Filtreleri temizle'),
        actionTo: '/discover',
      },
      notifications: {
        icon: Bell,
        title: t('empty.notifications.title', 'Bildirimin yok'),
        description: t('empty.notifications.description', 'Yeni rota önerileri ve kampanyalar burada görünecek.'),
        actionLabel: t('empty.notifications.action', 'Keşfe git'),
        actionTo: '/discover',
      },
      guideRoutes: {
        icon: Route,
        title: t('empty.guideRoutes.title', 'Rehberin henüz rotası yok'),
        description: t('empty.guideRoutes.description', 'İlk rotanı oluşturup incelemeye göndererek kazanmaya başla.'),
        actionLabel: t('empty.guideRoutes.action', 'İlk rotanı oluştur'),
        actionTo: '/guide/rotalar/yeni',
      },
      tripHistory: {
        icon: Map,
        title: t('empty.tripHistory.title', 'Geçmiş gezin yok'),
        description: t('empty.tripHistory.description', 'Kişisel rota planı veya rehber talebi oluşturarak başlayabilirsin.'),
        actionLabel: t('empty.tripHistory.action', 'Kişisel rotanı oluştur'),
        actionTo: '/assistant',
      },
      openTripsGuide: {
        icon: Search,
        title: t('empty.openTripsGuide.title', 'Şu an açık talep yok'),
        description: t('empty.openTripsGuide.description', 'Yeni turist talepleri geldiğinde burada listelenecek.'),
        actionLabel: t('empty.openTripsGuide.action', 'Keşfe git'),
        actionTo: '/discover',
      },
    }),
    [t],
  );
}
