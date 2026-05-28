import type { LucideIcon } from 'lucide-react';
import { Bell, Heart, Map, MessageSquare, Search, ShoppingBag, Route } from 'lucide-react';

export interface EmptyStateCopy {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}

export const EMPTY_STATES = {
  favorites: {
    icon: Heart,
    title: 'Henüz favori rotan yok',
    description: 'Beğendiğin rotaları kaydederek burada görebilirsin.',
    actionLabel: 'Rotaları Keşfet',
    actionTo: '/discover',
  },
  purchases: {
    icon: ShoppingBag,
    title: 'Henüz satın alınan rota yok',
    description: 'Sesli rehberli rotaları satın aldığında burada listelenir.',
    actionLabel: 'Rotaları Keşfet',
    actionTo: '/discover',
  },
  reviews: {
    icon: MessageSquare,
    title: 'Henüz yorum yok',
    description: 'Bu rotayı gezdikten sonra ilk yorumu sen yazabilirsin.',
    actionLabel: 'Rotayı incele',
    actionTo: '/discover',
  },
  search: {
    icon: Search,
    title: 'Arama sonucu bulunamadı',
    description: 'Farklı anahtar kelimeler veya daha geniş filtreler dene.',
    actionLabel: 'Filtreleri temizle',
    actionTo: '/discover',
  },
  notifications: {
    icon: Bell,
    title: 'Bildirimin yok',
    description: 'Yeni rota önerileri ve kampanyalar burada görünecek.',
    actionLabel: 'Keşfe git',
    actionTo: '/discover',
  },
  guideRoutes: {
    icon: Route,
    title: 'Rehberin henüz rotası yok',
    description: 'İlk rotanı oluşturup incelemeye göndererek kazanmaya başla.',
    actionLabel: 'İlk rotanı oluştur',
    actionTo: '/guide',
  },
  tripHistory: {
    icon: Map,
    title: 'Geçmiş gezin yok',
    description: 'Kişisel rota planı veya rehber talebi oluşturarak başlayabilirsin.',
    actionLabel: 'Kişisel rotanı oluştur',
    actionTo: '/assistant',
  },
} as const satisfies Record<string, EmptyStateCopy>;
