import { ChevronDown, ChevronUp, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { listPlaces } from '../../services/place-service';
import type { PlaceResponse } from '../../types/place';
import { PLACE_CATEGORY_LABELS } from '../../types/place';

const StopPickerMap = lazy(() =>
  import('../../features/map/stop-picker-map').then((m) => ({ default: m.StopPickerMap })),
);

export interface DraftStop {
  localId: string;
  stopId?: number;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  placeId?: number;
}

function newDraftStop(partial?: Partial<DraftStop>): DraftStop {
  return {
    localId: crypto.randomUUID(),
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    ...partial,
  };
}

function normalizeCityName(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

export function createEmptyDraftStop(): DraftStop {
  return newDraftStop();
}

export function draftStopFromPlace(place: PlaceResponse): DraftStop {
  return newDraftStop({
    title: place.name,
    description: place.description || `${place.district}, ${place.city}`,
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    placeId: place.place_id,
  });
}

export function draftStopFromResponse(stop: {
  stop_id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}): DraftStop {
  return newDraftStop({
    localId: `stop-${stop.stop_id}`,
    stopId: stop.stop_id,
    title: stop.title,
    description: stop.description,
    latitude: String(stop.latitude),
    longitude: String(stop.longitude),
  });
}

export function validateDraftStops(stops: DraftStop[]): Record<string, string> {
  const errors: Record<string, string> = {};
  if (stops.length === 0) {
    errors.stops = 'En az bir durak eklemelisin.';
    return errors;
  }
  stops.forEach((stop, index) => {
    if (!stop.title.trim()) {
      errors[`stop-${stop.localId}-title`] = `Durak ${index + 1}: başlık gerekli.`;
    }
    const lat = Number(stop.latitude);
    const lng = Number(stop.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors[`stop-${stop.localId}-lat`] = `Durak ${index + 1}: geçerli enlem gir.`;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors[`stop-${stop.localId}-lng`] = `Durak ${index + 1}: geçerli boylam gir.`;
    }
  });
  return errors;
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950';

export function RouteStopsBuilder({
  city,
  mapCenter,
  stops,
  onChange,
  errors = {},
}: {
  city: string;
  mapCenter: { lat: number; lng: number };
  stops: DraftStop[];
  onChange: (stops: DraftStop[]) => void;
  errors?: Record<string, string>;
}): ReactElement {
  const [placeQuery, setPlaceQuery] = useState('');
  const [activeLocalId, setActiveLocalId] = useState<string | null>(stops[0]?.localId ?? null);

  const { data: placeResults = [], isFetching: placesLoading } = useQuery({
    queryKey: ['guide-route-places', city, placeQuery],
    queryFn: () =>
      listPlaces({
        city,
        q: placeQuery.trim() || undefined,
        limit: 12,
      }),
    enabled: city.trim().length >= 2,
    staleTime: 60_000,
  });

  const filteredPlaces = useMemo(() => {
    const q = placeQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return placeResults.slice(0, 8);
    return placeResults
      .filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(q))
      .slice(0, 8);
  }, [placeResults, placeQuery]);

  const updateStop = (localId: string, patch: Partial<DraftStop>) => {
    onChange(stops.map((s) => (s.localId === localId ? { ...s, ...patch } : s)));
  };

  const addStop = (draft?: DraftStop) => {
    const next = draft ?? newDraftStop();
    onChange([...stops, next]);
    setActiveLocalId(next.localId);
  };

  const removeStop = (localId: string) => {
    const next = stops.filter((s) => s.localId !== localId);
    onChange(next);
    if (activeLocalId === localId) {
      setActiveLocalId(next[0]?.localId ?? null);
    }
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stops.length) return;
    const next = [...stops];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const handleMapPick = (lat: number, lng: number) => {
    if (!activeLocalId) {
      addStop(newDraftStop({ latitude: String(lat), longitude: String(lng) }));
      return;
    }
    updateStop(activeLocalId, { latitude: String(lat), longitude: String(lng) });
  };

  const pickerStops = stops
    .filter((s) => s.title.trim() && Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude)))
    .map((s) => ({
      localId: s.localId,
      title: s.title,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
    }));

  return (
    <div className="space-y-4 rounded-[18px] border border-stone-900/10 bg-stone-50/80 p-4 dark:border-white/10 dark:bg-zinc-950/50">
      <div>
        <h2 className="font-display text-lg font-bold">Duraklar</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Katalogdan mekan seç veya elle ekle. Sırayı yukarı/aşağı ile düzenle; haritaya tıklayarak konum belirle.
        </p>
        {errors.stops ? (
          <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
            {errors.stops}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold">
          Mekan ara ({city || 'şehir seç'})
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Örn. Ayasofya, Topkapı, Kapalıçarşı"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
          </div>
        </label>
        {placesLoading ? (
          <p className="text-xs text-stone-500">Mekanlar aranıyor…</p>
        ) : filteredPlaces.length > 0 ? (
          <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-stone-900/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
            {filteredPlaces.map((place) => (
              <li key={place.place_id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-primary/10"
                  onClick={() => addStop(draftStopFromPlace(place))}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-semibold">{place.name}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {PLACE_CATEGORY_LABELS[place.category]} · {place.district}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : city.trim().length >= 2 ? (
          <p className="text-xs text-stone-500">Bu şehirde eşleşen mekan bulunamadı; elle durak ekleyebilirsin.</p>
        ) : null}
      </div>

      <Suspense
        fallback={
          <div className="h-[min(36vh,280px)] animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" aria-busy="true" />
        }
      >
        <StopPickerMap
          activeLocalId={activeLocalId}
          center={mapCenter}
          stops={pickerStops}
          onPick={handleMapPick}
        />
      </Suspense>
      <p className="text-xs text-stone-500">
        {activeLocalId
          ? 'Seçili durağın konumunu haritada güncellemek için haritaya tıkla.'
          : 'Haritaya tıklayarak yeni durak ekle.'}
      </p>

      <div className="space-y-3">
        {stops.map((stop, index) => (
          <article
            key={stop.localId}
            className={`rounded-xl border p-3 ${
              activeLocalId === stop.localId
                ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="text-sm font-bold text-primary"
                onClick={() => setActiveLocalId(stop.localId)}
              >
                {index + 1}. durak
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-zinc-800"
                  disabled={index === 0}
                  title="Yukarı taşı"
                  onClick={() => moveStop(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-zinc-800"
                  disabled={index === stops.length - 1}
                  title="Aşağı taşı"
                  onClick={() => moveStop(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  title="Durak sil"
                  onClick={() => removeStop(stop.localId)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <label className="block text-sm font-semibold">
              Mekan adı
              <input
                className={fieldClass}
                maxLength={180}
                placeholder="Örn. Ayasofya Camii"
                value={stop.title}
                onChange={(e) => updateStop(stop.localId, { title: e.target.value })}
                onFocus={() => setActiveLocalId(stop.localId)}
              />
              {errors[`stop-${stop.localId}-title`] ? (
                <span className="mt-1 block text-xs text-red-600">{errors[`stop-${stop.localId}-title`]}</span>
              ) : null}
            </label>

            <label className="mt-3 block text-sm font-semibold">
              Açıklama / rehber notu
              <textarea
                className={`${fieldClass} min-h-[72px] resize-y`}
                maxLength={8000}
                placeholder="Ziyaret süresi, giriş bilgisi, dikkat edilecekler…"
                value={stop.description}
                onChange={(e) => updateStop(stop.localId, { description: e.target.value })}
                onFocus={() => setActiveLocalId(stop.localId)}
              />
            </label>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Enlem
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  placeholder="41.0086"
                  value={stop.latitude}
                  onChange={(e) => updateStop(stop.localId, { latitude: e.target.value })}
                  onFocus={() => setActiveLocalId(stop.localId)}
                />
                {errors[`stop-${stop.localId}-lat`] ? (
                  <span className="mt-1 block text-xs text-red-600">{errors[`stop-${stop.localId}-lat`]}</span>
                ) : null}
              </label>
              <label className="block text-sm font-semibold">
                Boylam
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  placeholder="28.9802"
                  value={stop.longitude}
                  onChange={(e) => updateStop(stop.localId, { longitude: e.target.value })}
                  onFocus={() => setActiveLocalId(stop.localId)}
                />
                {errors[`stop-${stop.localId}-lng`] ? (
                  <span className="mt-1 block text-xs text-red-600">{errors[`stop-${stop.localId}-lng`]}</span>
                ) : null}
              </label>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-stone-300"
        onClick={() => addStop()}
      >
        <Plus className="h-4 w-4" />
        Boş durak ekle
      </button>
    </div>
  );
}

export function resolveCityMapCenter(
  cityName: string,
  cities: { name_tr: string; center_lat: number; center_lng: number }[],
): { lat: number; lng: number } {
  const normalized = normalizeCityName(cityName);
  const match = cities.find((c) => normalizeCityName(c.name_tr) === normalized);
  if (match && match.center_lat && match.center_lng) {
    return { lat: match.center_lat, lng: match.center_lng };
  }
  return { lat: 39.0, lng: 35.0 };
}
