import { describe, expect, it } from 'vitest';

import { DEMO_ROUTES } from './demo-routes';

describe('DEMO_ROUTES', () => {
  it('provides offline fallback routes', () => {
    expect(DEMO_ROUTES.length).toBeGreaterThanOrEqual(4);
    expect(DEMO_ROUTES.every((r) => r.route_id >= 9000)).toBe(true);
    expect(DEMO_ROUTES.some((r) => r.city === 'İstanbul')).toBe(true);
  });
});
