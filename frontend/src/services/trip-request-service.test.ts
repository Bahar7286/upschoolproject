import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTripRequest, listMyTripRequests } from './trip-request-service';

describe('trip-request-service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createTripRequest posts with auth', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          request_id: 1,
          status: 'open',
          offer_count: 0,
          offers: [],
        }),
    });
    vi.stubGlobal('fetch', mock);

    const result = await createTripRequest('token', {
      title: 'Gezi',
      city: 'Istanbul',
      interests: ['history'],
      route_mode: 'custom',
      planned_stops: [
        { place_id: 1, name: 'A', order: 1 },
        { place_id: 2, name: 'B', order: 2 },
      ],
      group_size: 2,
      preferred_date: '2026-01-01',
      duration_minutes: 60,
      budget: 100,
      preferred_language: 'tr',
      message: 'Test mesajı uzun enough.',
    });
    expect(result.request_id).toBe(1);
    expect(mock.mock.calls[0][0]).toContain('/trip-requests');
  });

  it('listMyTripRequests uses GET', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });
    vi.stubGlobal('fetch', mock);

    const list = await listMyTripRequests('tok');
    expect(Array.isArray(list)).toBe(true);
    expect(mock.mock.calls[0][0]).toContain('/trip-requests/mine');
    const init = mock.mock.calls[0][1] as RequestInit | undefined;
    expect(init?.method ?? 'GET').toBe('GET');
  });
});
