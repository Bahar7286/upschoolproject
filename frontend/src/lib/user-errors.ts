import { ApiError, formatApiError } from './api';

export type ErrorKind =
  | 'api'
  | 'network'
  | 'validation'
  | 'unauthorized'
  | 'not_found'
  | 'payment'
  | 'empty_data';

export type ErrorContext =
  | 'general'
  | 'discover'
  | 'route-recommendations'
  | 'purchases'
  | 'route-detail'
  | 'assistant'
  | 'payment'
  | 'favorites';

export interface UserFacingError {
  kind: ErrorKind;
  message: string;
  alternative?: string;
  actionLabel?: string;
  actionTo?: string;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof ApiError && error.status === 0) return true;
  const msg = error instanceof Error ? error.message.toLowerCase() : '';
  return msg.includes('failed to fetch') || msg.includes('network');
}

const devHint = (text: string): string | undefined => (import.meta.env.DEV ? text : undefined);

export function mapError(error: unknown, context: ErrorContext = 'general'): UserFacingError {
  if (isNetworkError(error)) {
    if (context === 'assistant') {
      return {
        kind: 'network',
        message: 'Asistan şu an yanıt veremiyor. İnternet bağlantını kontrol edip tekrar dene.',
        alternative: devHint('Geliştirme: backend :8000 ve VITE_API_BASE_URL'),
        actionLabel: 'Sayfayı yenile',
      };
    }
    if (context === 'discover' || context === 'route-recommendations') {
      return {
        kind: 'network',
        message: 'Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar dene.',
        alternative: 'İlk bağlantı biraz sürebilir; birkaç saniye sonra yenilemeyi dene.',
        actionLabel: 'Sayfayı yenile',
      };
    }
    return {
      kind: 'network',
      message: 'Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar dene.',
      alternative: devHint('Geliştirme: backend ve veritabanının çalıştığından emin olun'),
      actionLabel: 'Sayfayı yenile',
    };
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        kind: 'unauthorized',
        message: 'Oturumun sona erdi veya giriş yapman gerekiyor.',
        actionLabel: 'Giriş yap',
        actionTo: '/login',
      };
    }
    if (error.status === 403) {
      return {
        kind: 'unauthorized',
        message: 'Bu içeriğe erişim yetkin yok.',
        alternative: 'Keşif sayfasından devam edebilirsin.',
        actionLabel: 'Keşfe dön',
        actionTo: '/discover',
      };
    }
    if (error.status === 404) {
      return {
        kind: 'not_found',
        message: 'Aradığın içerik bulunamadı.',
        actionLabel: 'Keşfe dön',
        actionTo: '/discover',
      };
    }
    if (error.status === 422) {
      return {
        kind: 'validation',
        message: formatApiError(error),
        alternative: 'Lütfen işaretli alanları kontrol et.',
      };
    }
    if (error.status >= 500) {
      if (context === 'assistant') {
        return {
          kind: 'api',
          message: 'Asistan şu an yanıt veremiyor. Lütfen biraz sonra tekrar dene.',
          alternative: 'Keşfet veya iller sayfasından rotalara göz atabilirsin.',
          actionLabel: 'Keşfe dön',
          actionTo: '/discover',
        };
      }
      if (context === 'route-recommendations' || context === 'discover') {
        return {
          kind: 'api',
          message: 'Rota önerilerini şu anda getiremiyoruz.',
          alternative: 'Popüler İstanbul rotalarını inceleyebilirsin.',
          actionLabel: 'İstanbul rotalarını keşfet',
          actionTo: '/discover?city=İstanbul',
        };
      }
      return {
        kind: 'api',
        message: 'Şu anda bu işlemi tamamlayamıyoruz. Biraz sonra tekrar dene.',
        actionLabel: 'Keşfe dön',
        actionTo: '/discover',
      };
    }
    if (context === 'payment' || error.body.toLowerCase().includes('payment')) {
      return {
        kind: 'payment',
        message: 'Ödeme tamamlanamadı.',
        alternative: 'Kart bilgilerini kontrol edebilir veya satın alımlarından durumu görebilirsin.',
        actionLabel: 'Satın alımlarım',
        actionTo: '/purchases',
      };
    }
  }

  return {
    kind: 'api',
    message: formatApiError(error),
    actionLabel: 'Keşfe dön',
    actionTo: '/discover',
  };
}

export function emptyDataError(title: string, description: string, actionLabel: string, actionTo: string): UserFacingError {
  return {
    kind: 'empty_data',
    message: title,
    alternative: description,
    actionLabel,
    actionTo,
  };
}
