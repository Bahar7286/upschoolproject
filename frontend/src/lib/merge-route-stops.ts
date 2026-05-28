import type { StopResponse } from '../types/stop';
import type { TripExtraStop } from '../types/trip-extra-stop';

export type MergedRouteStop = StopResponse & {
  is_extra?: boolean;
  extra_stop_id?: number;
  place_id?: number | null;
  google_place_id?: string | null;
};

export function mergeRouteStops(
  baseStops: StopResponse[],
  extraStops: TripExtraStop[],
): MergedRouteStop[] {
  const base: MergedRouteStop[] = baseStops.map((s) => ({ ...s, is_extra: false }));
  const extras: MergedRouteStop[] = extraStops.map((e) => ({
    stop_id: -e.extra_stop_id,
    route_id: e.route_id,
    title: e.title,
    description: e.description,
    latitude: e.latitude,
    longitude: e.longitude,
    order_index: e.order_index,
    audio_url: null,
    is_extra: true,
    extra_stop_id: e.extra_stop_id,
    place_id: e.place_id,
    google_place_id: e.google_place_id,
  }));
  return [...base, ...extras].sort((a, b) => a.order_index - b.order_index || a.stop_id - b.stop_id);
}

export function findInsertAfterOrder(
  merged: MergedRouteStop[],
  stopIndex: number,
): number | null {
  const target = merged[stopIndex];
  return target?.order_index ?? null;
}
