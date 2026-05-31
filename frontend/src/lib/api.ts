const DEFAULT_BASE = 'http://127.0.0.1:8000';
const MAX_NETWORK_RETRIES = 6;
const RETRY_BASE_MS = 500;
const HEALTH_TIMEOUT_MS = 25_000;
const KEEPALIVE_MS = 4 * 60 * 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;
export const ASSISTANT_REQUEST_TIMEOUT_MS = 120_000;
export const RECOMMEND_TIMEOUT_MS = 60_000;

export type RequestJsonOptions = RequestInit & {
  timeoutMs?: number;
  skipWake?: boolean;
};

export type ApiConnectionState = 'idle' | 'waking' | 'ready' | 'offline';

let connectionState: ApiConnectionState = 'idle';
const connectionListeners = new Set<(s: ApiConnectionState) => void>();

function setConnectionState(next: ApiConnectionState): void {
  connectionState = next;
  connectionListeners.forEach((fn) => fn(next));
}

export function getApiConnectionState(): ApiConnectionState {
  return connectionState;
}

export function subscribeApiConnection(fn: (s: ApiConnectionState) => void): () => void {
  connectionListeners.add(fn);
  fn(connectionState);
  return () => connectionListeners.delete(fn);
}

function isRenderWebHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
}

let apiReady = false;
let wakeInFlight: Promise<boolean> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0;
  }
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('network');
  }
  return false;
}

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
  init: RequestJsonOptions | undefined,
  accessToken: string | null | undefined,
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const skipWake = init?.skipWake ?? false;

  if (isRenderWebHost() && !apiReady && !skipWake) {
    setConnectionState('waking');
    const ok = await ensureApiReady(60_000);
    setConnectionState(ok ? 'ready' : 'offline');
  }

  const base = getApiBaseUrl().replace(/\/$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  const { timeoutMs: _t, skipWake: _s, ...fetchInit } = init ?? {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchInit.headers as Record<string, string> | undefined),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response!: Response;
  let lastNetworkError: unknown;
  for (let attempt = 0; attempt < MAX_NETWORK_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetch(`${base}${rel}`, {
        ...fetchInit,
        headers,
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      lastNetworkError = undefined;
      break;
    } catch (err) {
      window.clearTimeout(timer);
      lastNetworkError = err;
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (aborted && attempt === MAX_NETWORK_RETRIES - 1) {
        throw new ApiError('İstek zaman aşımına uğradı. Sunucu uyanıyor olabilir; tekrar deneyin.', 0, '');
      }
      if (attempt < MAX_NETWORK_RETRIES - 1 && isRetryableNetworkError(err)) {
        if (isRenderWebHost()) {
          apiReady = false;
          setConnectionState('waking');
          await ensureApiReady(30_000);
        }
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      const msg = err instanceof Error ? err.message : 'Network error';
      throw new ApiError(msg, 0, '');
    }
  }
  if (lastNetworkError) {
    const msg = lastNetworkError instanceof Error ? lastNetworkError.message : 'Network error';
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

  if (response.ok) {
    markApiReady();
    setConnectionState('ready');
  }

  if (response.status === 204 || text.length === 0) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function requestJson<T>(path: string, init?: RequestJsonOptions): Promise<T> {
  return requestJsonImpl<T>(path, init, undefined);
}

export async function requestJsonWithAuth<T>(
  path: string,
  accessToken: string | null,
  init?: RequestJsonOptions,
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

export async function pingHealth(): Promise<boolean> {
  try {
    const base = getApiBaseUrl().replace(/\/$/, '');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const response = await fetch(`${base}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

/** Render cold start — ilk istekten önce API'yi uyandır. */
export async function ensureApiReady(maxWaitMs = 60_000): Promise<boolean> {
  if (apiReady) {
    setConnectionState('ready');
    return true;
  }
  if (!isRenderWebHost()) {
    apiReady = true;
    setConnectionState('ready');
    return true;
  }
  setConnectionState('waking');
  if (!wakeInFlight) {
    wakeInFlight = wakeUpApi(maxWaitMs).finally(() => {
      wakeInFlight = null;
    });
  }
  const ok = await wakeInFlight;
  if (ok) {
    apiReady = true;
    setConnectionState('ready');
  } else {
    setConnectionState('offline');
  }
  return ok;
}

/** Sekme açıkken periyodik ping — sunucuyu uykuya dalmaktan geciktirir. */
export function startApiKeepAlive(): () => void {
  if (!isRenderWebHost()) return () => undefined;
  const tick = () => {
    if (document.visibilityState === 'visible') {
      void pingHealth().then((ok) => {
        if (ok) apiReady = true;
      });
    }
  };
  const id = window.setInterval(tick, KEEPALIVE_MS);
  return () => window.clearInterval(id);
}

export function markApiReady(): void {
  apiReady = true;
}

/** Render free tier cold start — API uyanana kadar dener. */
export async function wakeUpApi(maxWaitMs = 90_000): Promise<boolean> {
  if (await pingHealth()) return true;
  const started = Date.now();
  let delay = 800;
  while (Date.now() - started < maxWaitMs) {
    await sleep(delay);
    if (await pingHealth()) return true;
    delay = Math.min(Math.round(delay * 1.35), 8000);
  }
  return false;
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
      if (error.message.includes('zaman aşımı')) {
        return 'Sunucu yanıt vermedi (zaman aşımı). Render ücretsiz planda ilk istek 30–60 sn sürebilir; tekrar deneyin.';
      }
      if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        return 'Sunucu uyanıyor olabilir (30–60 sn). Birkaç saniye bekleyip tekrar deneyin veya sayfayı yenileyin.';
      }
      return 'Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar deneyin.';
    }
    if (error.status === 503) {
      return 'Harita ve mekan bilgisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
    }

    return error.message || `İstek başarısız (${error.status}).`;
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('failed to fetch')) {
      if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
        return 'Sunucuya bağlanılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
      }
      return 'Sunucuya bağlanılamadı. Bağlantını kontrol edip tekrar deneyin.';
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
