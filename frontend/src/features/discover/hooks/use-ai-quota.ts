import { useAuthStore } from '../../../stores/auth-store';

export function canUseAiDaily(): boolean {
  const user = useAuthStore.getState().user;
  if (user?.is_premium) return true;
  const uid = user?.user_id ?? 0;
  const day = new Date().toISOString().slice(0, 10);
  const key = `hg_ai_daily_${uid}_${day}`;
  const used = Number(localStorage.getItem(key) ?? '0');
  if (used >= 3) return false;
  localStorage.setItem(key, String(used + 1));
  return true;
}
