import { useThemeStore, type ThemePreference } from '../stores/theme-store';
import type { UserResponse } from '../types/user';

let syncedForUserId: number | null = null;

/** Oturum başına bir kez sunucudaki tema tercihini uygular (sayfa geçişlerinde tekrarlanmaz). */
export function syncThemeFromUserOnce(user: UserResponse | null | undefined): void {
  if (!user?.user_id) return;
  if (syncedForUserId === user.user_id) return;
  syncedForUserId = user.user_id;
  const pref = user.theme_preference?.trim();
  if (pref) {
    useThemeStore.getState().setPreference(pref as ThemePreference);
  }
}

export function resetThemeSync(): void {
  syncedForUserId = null;
}
