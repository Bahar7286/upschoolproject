import { requestJsonWithAuth } from '../lib/api';
import type {
  CompleteRouteResponse,
  GamificationResponse,
  LeaderboardResponse,
  RedeemRewardResponse,
  UserPreferencesPayload,
  UserResponse,
} from '../types/user';

export async function updatePreferences(
  accessToken: string,
  payload: UserPreferencesPayload,
): Promise<UserResponse> {
  return requestJsonWithAuth<UserResponse>('/auth/me/preferences', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchGamification(accessToken: string): Promise<GamificationResponse> {
  return requestJsonWithAuth<GamificationResponse>('/auth/me/gamification', accessToken, {
    method: 'GET',
  });
}

export async function fetchLeaderboard(accessToken: string): Promise<LeaderboardResponse> {
  return requestJsonWithAuth<LeaderboardResponse>('/auth/leaderboard', accessToken, {
    method: 'GET',
  });
}

export async function redeemReward(
  accessToken: string,
  rewardId: string,
): Promise<RedeemRewardResponse> {
  return requestJsonWithAuth<RedeemRewardResponse>('/auth/me/rewards/redeem', accessToken, {
    method: 'POST',
    body: JSON.stringify({ reward_id: rewardId }),
  });
}

export async function completeRoute(
  accessToken: string,
  routeId: number,
): Promise<CompleteRouteResponse> {
  return requestJsonWithAuth<CompleteRouteResponse>(
    `/auth/me/routes/${routeId}/complete`,
    accessToken,
    { method: 'POST' },
  );
}
