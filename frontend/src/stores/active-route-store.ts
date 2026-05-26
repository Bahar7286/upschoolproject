import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { StopResponse } from '../types/stop';

export interface ActiveRouteState {
  routeId: number | null;
  routeTitle: string;
  stops: StopResponse[];
  currentStopIndex: number;
  setActiveRoute: (routeId: number, title: string, stops: StopResponse[]) => void;
  setCurrentStopIndex: (index: number) => void;
  clearActiveRoute: () => void;
}

export const useActiveRouteStore = create<ActiveRouteState>()(
  persist(
    (set) => ({
      routeId: null,
      routeTitle: '',
      stops: [],
      currentStopIndex: 0,
      setActiveRoute: (routeId, routeTitle, stops) =>
        set({ routeId, routeTitle, stops, currentStopIndex: 0 }),
      setCurrentStopIndex: (currentStopIndex) => set({ currentStopIndex }),
      clearActiveRoute: () =>
        set({ routeId: null, routeTitle: '', stops: [], currentStopIndex: 0 }),
    }),
    { name: 'historial_go_active_route' },
  ),
);
