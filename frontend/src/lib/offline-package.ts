import type { StopResponse } from '../types/stop';

export const OFFLINE_STORAGE_KEY = 'historial_go_offline_route';

export type OfflineRoutePackage = {
  routeId: number;
  routeTitle: string;
  city?: string;
  stops: StopResponse[];
  savedAt: string;
};

export function saveOfflineRoutePackage(pkg: OfflineRoutePackage): void {
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(pkg));
}

export function loadOfflineRoutePackage(): OfflineRoutePackage | null {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineRoutePackage;
  } catch {
    return null;
  }
}
