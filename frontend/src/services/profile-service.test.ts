import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLeaderboard } from './profile-service';

describe('fetchLeaderboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-07 requests auth leaderboard with bearer token', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          period: 'weekly',
          entries: [{ rank: 1, user_id: 1, full_name: 'A', xp: 100, streak_days: 0, badge_count: 0 }],
          your_rank: 1,
        }),
    });
    vi.stubGlobal('fetch', mock);

    const board = await fetchLeaderboard('test-token');
    expect(board.entries).toHaveLength(1);
    const [, init] = mock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    expect(mock.mock.calls[0][0]).toContain('/auth/leaderboard');
  });
});
