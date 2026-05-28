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

export function mapError(error: unknown, context: ErrorContext = 'general'): UserFacingError {
  if (isNetworkError(error)) {
    if (context === 'assistant') {
      return {
        kind: 'network',
        message: 'Asistan sunucusuna ulaşılamıyor (API kapalı veya yanlış adres).',
        alternative:
          'Yerelde backend: uvicorn :8000 · frontend .env: VITE_API_BASE_URL=http://127.0.0.1:8000',
        actionLabel: 'Sayfayı yenile',
      };
    }
    if (context === 'discover' || context === 'route-recommendations') {
      return {
        kind: 'network',
        message: 'Sunucuya bağlanılamadı. API adresini veya internet bağlantını kontrol et.',
        alternative: 'Render kullanıyorsan API servisinin uyandığını doğrula (ilk istek yavaş olabilir).',
        actionLabel: 'Sayfayı yenile',
      };
    }
    return {
      kind: 'network',
      message: 'Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar dene.',
      alternative: 'Yerelde çalışıyorsan backend ve docker (PostgreSQL) açık olmalı.',
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
          message: 'AI asistan şu an yanıt veremiyor (LLM anahtarı veya model).',
          alternative: 'backend/.env içinde OPENROUTER_API_KEY ve OPENROUTER_MODEL kontrol edin.',
          actionLabel: 'Tekrar dene',
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
