import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchCurrentUser, loginUser, requestPasswordReset } from './auth-service';

describe('auth-service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loginUser posts credentials', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ access_token: 'tok', token_type: 'bearer' }),
    });
    vi.stubGlobal('fetch', mock);

    const res = await loginUser({ email: 'a@b.com', password: 'secret12' });
    expect(res.access_token).toBe('tok');
    expect(mock.mock.calls[0][0]).toContain('/auth/login');
  });

  it('fetchCurrentUser sends bearer token', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          user_id: 1,
          full_name: 'T',
          email: 't@e.com',
          role: 'tourist',
        }),
    });
    vi.stubGlobal('fetch', mock);

    await fetchCurrentUser('my-jwt');
    const [, init] = mock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer my-jwt');
  });

  it('requestPasswordReset posts email', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'ok' }),
    });
    vi.stubGlobal('fetch', mock);

    await requestPasswordReset('user@example.com');
    expect(mock.mock.calls[0][0]).toContain('/auth/forgot-password');
  });
});
