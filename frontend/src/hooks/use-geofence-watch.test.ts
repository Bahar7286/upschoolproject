import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGeofenceWatch } from './use-geofence-watch';

describe('useGeofenceWatch', () => {
  const clearWatch = vi.fn();
  let positionCallback: PositionCallback | null = null;

  beforeEach(() => {
    positionCallback = null;
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

  it('FE-06 calls onTriggered when user is within geofence radius', async () => {
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

    const { unmount, result } = renderHook(() => useGeofenceWatch(1, stops, onTriggered));

    expect(positionCallback).toBeTruthy();
    expect(result.current.watching).toBe(true);

    await act(async () => {
      positionCallback?.({
        coords: {
          latitude: 41.0,
          longitude: 28.9,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    await waitFor(() => {
      expect(onTriggered).toHaveBeenCalledWith(0, 'Sesli rehber tetiklendi: Durak');
    });

    expect(result.current.geofenceMessage).toBe('Sesli rehber tetiklendi: Durak');
    unmount();
    expect(clearWatch).toHaveBeenCalledWith(1);
  });

  it('starts watching for personal routes (routeId 0)', () => {
    const stops = [
      {
        stop_id: -1,
        route_id: 0,
        title: 'Kişisel durak',
        description: '',
        latitude: 41.0,
        longitude: 28.9,
        order_index: 0,
        audio_url: null,
      },
    ];

    const { result, unmount } = renderHook(() => useGeofenceWatch(0, stops));

    expect(result.current.watching).toBe(true);
    unmount();
  });
});
