import { useEffect } from 'react';

import { recordPlaceVisit } from '../services/place-visit-service';
import type { PlaceVisitPayload } from '../types/place-visit';

/** Giriş yapmış kullanıcı için mekan ziyaretini bir kez kaydeder. */
export function useRecordPlaceVisit(
  accessToken: string | null,
  payload: PlaceVisitPayload | null,
): void {
  useEffect(() => {
    if (!accessToken || !payload) return;
    void recordPlaceVisit(accessToken, payload).catch(() => {
      /* sessiz — öneri sistemi kritik değil */
    });
  }, [accessToken, payload?.entity_type, payload?.entity_key, payload?.source]);
}
