import { afterEach, describe, expect, it } from 'vitest';

import {
  loadOfflineRoutePackage,
  OFFLINE_STORAGE_KEY,
  saveOfflineRoutePackage,
  type OfflineRoutePackage,
} from './offline-package';

const sample: OfflineRoutePackage = {
  routeId: 1,
  routeTitle: 'Test Route',
  city: 'Istanbul',
  stops: [
    {
      stop_id: 1,
      route_id: 1,
      title: 'Durak 1',
      description: 'Açıklama',
      latitude: 41.0,
      longitude: 28.9,
      order_index: 0,
      audio_url: null,
    },
  ],
  savedAt: '2026-01-01T00:00:00.000Z',
};

describe('offline-package', () => {
  afterEach(() => {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
  });

  it('FE-03 save and load roundtrip', () => {
    saveOfflineRoutePackage(sample);
    const loaded = loadOfflineRoutePackage();
    expect(loaded?.routeId).toBe(1);
    expect(loaded?.routeTitle).toBe('Test Route');
    expect(loaded?.stops).toHaveLength(1);
  });

  it('FE-04 returns null for corrupt JSON', () => {
    localStorage.setItem(OFFLINE_STORAGE_KEY, '{not-json');
    expect(loadOfflineRoutePackage()).toBeNull();
  });
});
