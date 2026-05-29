import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, formatApiError, getApiBaseUrl } from './api';

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('FE-02 uses default when env unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    expect(getApiBaseUrl()).toBe('http://127.0.0.1:8000');
  });

  it('FE-02 uses default when env is empty string', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    expect(getApiBaseUrl()).toBe('http://127.0.0.1:8000');
  });

  it('FE-02 respects VITE_API_BASE_URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.test:9000');
    expect(getApiBaseUrl()).toBe('http://api.test:9000');
  });
});

describe('formatApiError', () => {
  it('FE-01 maps 401 to Turkish message', () => {
    const err = new ApiError('Unauthorized', 401, '{"detail":"Invalid email or password"}');
    expect(formatApiError(err)).toBe('E-posta veya şifre hatalı.');
  });

  it('FE-01 maps 403', () => {
    const err = new ApiError('Forbidden', 403, '');
    expect(formatApiError(err)).toBe('Bu işlem için yetkiniz yok.');
  });

  it('FE-01 maps 422', () => {
    const err = new ApiError('Unprocessable', 422, '');
    expect(formatApiError(err)).toContain('doğrulanamadı');
  });

  it('FE-01 maps network failure', () => {
    const err = new Error('Failed to fetch');
    expect(formatApiError(err)).toContain('Sunucuya bağlanılamadı');
  });

  it('FE-01 maps ApiError status 0 as connection failure', () => {
    const err = new ApiError('Failed to fetch', 0, '');
    expect(formatApiError(err)).toContain('Sunucuya bağlanılamadı');
  });
});
