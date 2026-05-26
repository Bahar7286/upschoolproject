import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPaymentConfig } from './payment-checkout-service';

describe('fetchPaymentConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-08 calls payments config endpoint', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ stripe_enabled: false, publishable_key: null }),
    });
    vi.stubGlobal('fetch', mock);

    const cfg = await fetchPaymentConfig();
    expect(cfg.stripe_enabled).toBe(false);
    expect(mock.mock.calls[0][0]).toContain('/payments/config');
  });
});
