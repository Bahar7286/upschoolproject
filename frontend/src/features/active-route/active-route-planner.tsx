import { ListPlus, Trash2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { findInsertAfterOrder, type MergedRouteStop } from '../../lib/merge-route-stops';
import { formatApiError } from '../../lib/api';
import { addTripExtraStop, removeTripExtraStop } from '../../services/trip-extra-stop-service';
import { useActiveRouteStore } from '../../stores/active-route-store';
import { useAuthStore } from '../../stores/auth-store';

export function ActiveRoutePlanner({
  mergedStops,
  currentStopIndex,
  onSelectStop,
}: {
  mergedStops: MergedRouteStop[];
  currentStopIndex: number;
  onSelectStop: (index: number) => void;
}): ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const routeId = useActiveRouteStore((s) => s.routeId);
  const addExtraStopLocal = useActiveRouteStore((s) => s.addExtraStopLocal);
  const removeExtraStopLocal = useActiveRouteStore((s) => s.removeExtraStopLocal);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRemove = async (stop: MergedRouteStop) => {
    if (!stop.is_extra || !stop.extra_stop_id || !routeId || !accessToken) return;
    setBusy(true);
    setError('');
    try {
      await removeTripExtraStop(routeId, stop.extra_stop_id, accessToken);
      removeExtraStopLocal(stop.extra_stop_id);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">Rota planı</p>
      <p className="text-xs text-stone-600 dark:text-stone-400">
        Eklediğiniz duraklar yalnızca size özeldir; orijinal rota değişmez.
      </p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <ol className="max-h-56 space-y-2 overflow-y-auto">
        {mergedStops.map((stop, index) => (
          <li
            key={stop.is_extra ? `e-${stop.extra_stop_id}` : `b-${stop.stop_id}`}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
              index === currentStopIndex
                ? 'border-primary bg-primary/10'
                : 'border-stone-900/10 dark:border-white/10'
            }`}
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left font-semibold"
              onClick={() => onSelectStop(index)}
            >
              <span className="text-xs text-stone-500">{index + 1}.</span> {stop.title}
              {stop.is_extra ? (
                <span className="ml-1 rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  Ek
                </span>
              ) : null}
            </button>
            {stop.is_extra ? (
              <button
                type="button"
                className="tap-scale shrink-0 rounded-lg p-2 text-red-600"
                disabled={busy}
                aria-label="Ek durağı kaldır"
                onClick={() => void handleRemove(stop)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function useAddPlaceToActiveRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const routeId = useActiveRouteStore((s) => s.routeId);
  const mergedStops = useActiveRouteStore((s) => s.mergedStops);
  const currentStopIndex = useActiveRouteStore((s) => s.currentStopIndex);
  const addExtraStopLocal = useActiveRouteStore((s) => s.addExtraStopLocal);

  const addPlace = async (params: {
    title: string;
    latitude: number;
    longitude: number;
    description?: string;
    place_id?: number;
    google_place_id?: string;
    insertAfterCurrent?: boolean;
  }): Promise<string | null> => {
    if (!routeId || !accessToken) {
      return 'Önce bir rotayı başlatın (rota detay → Rotayı başlat).';
    }
    const merged = mergedStops();
    const insertAfter = params.insertAfterCurrent
      ? findInsertAfterOrder(merged, currentStopIndex)
      : findInsertAfterOrder(merged, merged.length - 1);
    try {
      const created = await addTripExtraStop(routeId, accessToken, {
        title: params.title,
        latitude: params.latitude,
        longitude: params.longitude,
        description: params.description ?? '',
        place_id: params.place_id ?? null,
        google_place_id: params.google_place_id ?? null,
        insert_after_order_index: insertAfter,
      });
      addExtraStopLocal(created);
      return null;
    } catch (err) {
      return formatApiError(err);
    }
  };

  return { routeId, addPlace };
}

export function AddToActiveRouteButton({
  title,
  latitude,
  longitude,
  description,
  placeId,
  googlePlaceId,
  className = '',
}: {
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
  placeId?: number;
  googlePlaceId?: string;
  className?: string;
}): ReactElement {
  const { routeId, addPlace } = useAddPlaceToActiveRoute();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (!routeId) return <></>;

  return (
    <div className={className}>
      <button
        type="button"
        className="tap-scale inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-50 px-4 text-sm font-bold text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setMsg('');
          void addPlace({
            title,
            latitude,
            longitude,
            description,
            place_id: placeId,
            google_place_id: googlePlaceId,
            insertAfterCurrent: true,
          }).then((err) => {
            setMsg(err ?? 'Rotaya eklendi ✓');
            setBusy(false);
          });
        }}
      >
        <ListPlus className="h-5 w-5" aria-hidden="true" />
        {busy ? 'Ekleniyor…' : 'Aktif rotaya ekle (sonrasına)'}
      </button>
      {msg ? <p className="mt-2 text-xs font-medium text-stone-600">{msg}</p> : null}
    </div>
  );
}
