import { useEffect, useState } from 'react';

import { formatApiError } from '../../../lib/api';
import { mapError } from '../../../lib/user-errors';
import { listPlans } from '../../../services/plan-service';
import { fetchGamification, fetchLeaderboard } from '../../../services/profile-service';
import { listMyNotes } from '../../../services/social-service';
import type { NoteResponse } from '../../../types/social';
import type { PlanResponse } from '../../../types/plan';
import type { GamificationResponse, LeaderboardResponse } from '../../../types/user';

export function useProfileData(accessToken: string | null, userId: number | undefined) {
  const [stats, setStats] = useState<GamificationResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken || !userId) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        fetchGamification(accessToken),
        listPlans(accessToken),
        listMyNotes(accessToken),
        fetchLeaderboard(accessToken),
      ]);
      if (cancelled) return;
      const [gamR, plansR, notesR, boardR] = results;
      if (gamR.status === 'fulfilled') setStats(gamR.value);
      if (plansR.status === 'fulfilled') setPlans(plansR.value);
      if (notesR.status === 'fulfilled') setNotes(notesR.value);
      if (boardR.status === 'fulfilled') setLeaderboard(boardR.value);
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length === results.length) {
        setError(mapError((failed[0] as PromiseRejectedResult).reason).message);
      } else if (failed.length > 0) {
        setError('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId]);

  return {
    stats,
    setStats,
    leaderboard,
    plans,
    notes,
    setNotes,
    error,
    setError,
    formatApiError,
  };
}
