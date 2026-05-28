export interface UserCreatePayload {
  full_name: string;
  email: string;
  role?: 'tourist' | 'guide' | 'admin';
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  role?: 'tourist' | 'guide' | 'admin';
}

export interface UserResponse {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  interests: string[];
  duration_minutes: number;
  budget: number;
  theme_preference: string;
  preferred_language: string;
  preferred_city?: string | null;
  onboarding_completed: boolean;
  xp: number;
  streak_days: number;
  badges: string[];
  is_premium?: boolean;
}

export interface UserPreferencesPayload {
  interests: string[];
  duration_minutes: number;
  budget: number;
  theme_preference: string;
  preferred_language: string;
  preferred_city?: string | null;
  onboarding_completed: boolean;
}

export interface XpRuleItem {
  id: string;
  title: string;
  description: string;
  xp: number;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost_xp: number;
  reward_type: string;
  value_label: string;
  owned: boolean;
}

export interface GamificationResponse {
  xp: number;
  streak_days: number;
  level: number;
  level_name: string;
  next_level_xp: number;
  badges: string[];
  weekly_rank: number;
  xp_rules: XpRuleItem[];
  rewards: RewardItem[];
  redeemed_rewards: string[];
}

export interface RedeemRewardResponse {
  reward_id: string;
  title: string;
  code: string;
  remaining_xp: number;
  message: string;
}

export interface CompleteRouteResponse {
  xp_gained: number;
  total_xp: number;
  streak_days: number;
  new_badges: string[];
  level_name: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  full_name: string;
  xp: number;
  streak_days: number;
  badge_count: number;
}

export interface LeaderboardResponse {
  period: string;
  entries: LeaderboardEntry[];
  your_rank: number | null;
}

export const BADGE_LABELS: Record<string, string> = {
  welcome: 'Hoş Geldin',
  first_step: 'İlk Adım',
  route_explorer: 'Rota Kaşifi',
  streak_3: 'Azimli Gezgin',
  streak_7: 'Şehir Çınarı',
};
