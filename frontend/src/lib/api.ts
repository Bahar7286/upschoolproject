const DEFAULT_BASE = 'http://127.0.0.1:8000';

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, '');
  }
  // Production fallback for Render deployments where env wasn't injected at build time.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.onrender.com') && host.includes('historial-go-web')) {
      return 'https://historial-go-api.onrender.com';
    }
  }
  return DEFAULT_BASE;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function requestJsonImpl<T>(
  path: string,
  init: RequestInit | undefined,
  accessToken: string | null | undefined,
): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${base}${rel}`, {
      ...init,
      headers,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(msg, 0, '');
  }

  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(
      text || `Request failed with status ${response.status}`,
      response.status,
      text,
    );
  }

  if (response.status === 204 || text.length === 0) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJsonImpl<T>(path, init, undefined);
}

export async function requestJsonWithAuth<T>(
  path: string,
  accessToken: string | null,
  init?: RequestInit,
): Promise<T> {
  return requestJsonImpl<T>(path, init, accessToken);
}

export async function requestMultipartWithAuth<T>(
  path: string,
  accessToken: string,
  formData: FormData,
): Promise<T> {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${base}${rel}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(text || `Request failed with status ${response.status}`, response.status, text);
  }
  return JSON.parse(text) as T;
}

/** FastAPI `detail` alanını Türkçe kullanıcı mesajına çevirir. */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.body) as {
        detail?: string | Array<{ msg?: string; loc?: unknown[] }>;
      };
      if (typeof parsed.detail === 'string') {
        return translateBackendDetail(parsed.detail);
      }
      if (Array.isArray(parsed.detail)) {
        const first = parsed.detail[0];
        if (first && typeof first.msg === 'string') {
          return first.msg;
        }
      }
    } catch {
      /* ham gövde veya HTML */
    }

    if (error.status === 401) {
      return 'E-posta veya şifre hatalı.';
    }
    if (error.status === 403) {
      return 'Bu işlem için yetkiniz yok.';
    }
    if (error.status === 409) {
      return 'Bu kayıt zaten mevcut.';
    }
    if (error.status === 422) {
      return 'Girdi doğrulanamadı. Alanları kontrol edin.';
    }
    if (error.status === 0 || error.message.toLowerCase().includes('failed to fetch')) {
      if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        return 'Sunucuya bağlanılamadı. Birkaç dakika sonra tekrar deneyin veya sayfayı yenileyin.';
      }
      return 'Sunucuya bağlanılamadı. API adresini kontrol edin.';
    }
    if (error.status === 503) {
      return 'Bu özellik şu an kullanılamıyor. Yönetici Google API anahtarlarını yapılandırmalı.';
    }

    return error.message || `İstek başarısız (${error.status}).`;
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('failed to fetch')) {
      if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        return 'Sunucuya bağlanılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
      }
      return 'Sunucuya bağlanılamadı. Backend çalışıyor mu?';
    }
    return error.message;
  }

  return 'Beklenmeyen bir hata oluştu.';
}

function translateBackendDetail(detail: string): string {
  const map: Record<string, string> = {
    'Invalid email or password': 'E-posta veya şifre hatalı.',
    'Email already registered': 'Bu e-posta ile kayıt zaten var.',
    'User not found': 'Kullanıcı bulunamadı.',
    'Not authenticated': 'Oturum bulunamadı.',
  };
  return map[detail] ?? detail;
}
