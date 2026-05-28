import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeRouteStops, type MergedRouteStop } from '../lib/merge-route-stops';
import type { StopResponse } from '../types/stop';
import type { TripExtraStop } from '../types/trip-extra-stop';

export interface ActiveRouteState {
  routeId: number | null;
  routeTitle: string;
  baseStops: StopResponse[];
  extraStops: TripExtraStop[];
  currentStopIndex: number;
  mergedStops: () => MergedRouteStop[];
  setActiveRoute: (routeId: number, title: string, stops: StopResponse[], extras?: TripExtraStop[]) => void;
  setExtraStops: (extras: TripExtraStop[]) => void;
  addExtraStopLocal: (stop: TripExtraStop) => void;
  removeExtraStopLocal: (extraStopId: number) => void;
  setCurrentStopIndex: (index: number) => void;
  clearActiveRoute: () => void;
}

export const useActiveRouteStore = create<ActiveRouteState>()(
  persist(
    (set, get) => ({
      routeId: null,
      routeTitle: '',
      baseStops: [],
      extraStops: [],
      currentStopIndex: 0,
      mergedStops: () => mergeRouteStops(get().baseStops, get().extraStops),
      setActiveRoute: (routeId, routeTitle, stops, extras = []) =>
        set({ routeId, routeTitle, baseStops: stops, extraStops: extras, currentStopIndex: 0 }),
      setExtraStops: (extraStops) => set({ extraStops }),
      addExtraStopLocal: (stop) =>
        set((s) => ({
          extraStops: [...s.extraStops, stop].sort((a, b) => a.order_index - b.order_index),
        })),
      removeExtraStopLocal: (extraStopId) =>
        set((s) => ({
          extraStops: s.extraStops.filter((e) => e.extra_stop_id !== extraStopId),
        })),
      setCurrentStopIndex: (currentStopIndex) => set({ currentStopIndex }),
      clearActiveRoute: () =>
        set({
          routeId: null,
          routeTitle: '',
          baseStops: [],
          extraStops: [],
          currentStopIndex: 0,
        }),
    }),
    { name: 'historial_go_active_route' },
  ),
);
