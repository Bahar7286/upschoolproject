import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../../../stores/auth-store';
import { canUseAiDaily } from './use-ai-quota';

describe('canUseAiDaily', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null });
  });

  it('allows premium users without incrementing quota', () => {
    useAuthStore.setState({
      user: {
        user_id: 1,
        is_premium: true,
      } as never,
    });
    expect(canUseAiDaily()).toBe(true);
    const day = new Date().toISOString().slice(0, 10);
    expect(localStorage.getItem(`hg_ai_daily_1_${day}`)).toBeNull();
  });

  it('increments daily quota for free users', () => {
    useAuthStore.setState({ user: { user_id: 42, is_premium: false } as never });
    expect(canUseAiDaily()).toBe(true);
    expect(canUseAiDaily()).toBe(true);
    expect(canUseAiDaily()).toBe(true);
    expect(canUseAiDaily()).toBe(false);
  });
});
