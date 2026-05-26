import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as aiService from '../services/ai-service';
import { useGeofenceWatch } from './use-geofence-watch';

describe('useGeofenceWatch', () => {
  const clearWatch = vi.fn();
  let positionCallback: PositionCallback | null = null;

  beforeEach(() => {
    positionCallback = null;
    vi.spyOn(aiService, 'checkGeofence').mockResolvedValue({
      triggered: true,
      stop_id: 10,
      message: 'Tetiklendi',
      distance_m: 5,
    });
    vi.stubGlobal(
      'navigator',
      {
        geolocation: {
          watchPosition: vi.fn((success: PositionCallback) => {
            positionCallback = success;
            return 1;
          }),
          clearWatch,
        },
      } as unknown as Navigator,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-06 calls onTriggered when geofence fires', async () => {
    const onTriggered = vi.fn();
    const stops = [
      {
        stop_id: 10,
        route_id: 1,
        title: 'Durak',
        description: '',
        latitude: 41.0,
        longitude: 28.9,
        order_index: 0,
        audio_url: null,
      },
    ];

    const { unmount } = renderHook(() => useGeofenceWatch(1, stops, onTriggered));

    expect(positionCallback).toBeTruthy();
    positionCallback?.({
      coords: { latitude: 41.0, longitude: 28.9, accuracy: 1, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now(),
    } as GeolocationPosition);

    await waitFor(
      () => {
        expect(aiService.checkGeofence).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(onTriggered).toHaveBeenCalledWith(0, 'Tetiklendi');
      },
      { timeout: 3000 },
    );

    unmount();
  });
});
