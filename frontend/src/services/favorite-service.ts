import { requestJsonWithAuth } from '../lib/api';

import type { PlaceResponse } from '../types/place';

export type FavoriteEntityType = 'place' | 'route';

export interface FavoriteItem {
  entity_type: FavoriteEntityType;
  entity_id: number;
  created_at: string;
  place?: PlaceResponse | null;
}

export async function listFavorites(accessToken: string): Promise<FavoriteItem[]> {
  return requestJsonWithAuth<FavoriteItem[]>('/favorites', accessToken);
}

export async function addFavorite(
  accessToken: string,
  entityType: FavoriteEntityType,
  entityId: number,
): Promise<void> {
  await requestJsonWithAuth('/favorites', accessToken, {
    method: 'POST',
    body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
  });
}

export async function removeFavorite(
  accessToken: string,
  entityType: FavoriteEntityType,
  entityId: number,
): Promise<void> {
  await requestJsonWithAuth(`/favorites/${entityType}/${entityId}`, accessToken, {
    method: 'DELETE',
  });
}

