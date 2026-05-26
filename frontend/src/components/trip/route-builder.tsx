import { GripVertical, MapPin, Plus, X } from 'lucide-react';
import type { ReactElement } from 'react';

import { usePlacesQuery } from '../../hooks/use-places-query';
import type { PlannedStop } from '../../services/trip-request-service';

type Props = {
  stops: PlannedStop[];
  onChange: (stops: PlannedStop[]) => void;
};

export function RouteBuilder({ stops, onChange }: Props): ReactElement {
  const { data: places = [], isLoading } = usePlacesQuery(null);

  const addPlace = (placeId: number, name: string) => {
    if (stops.some((s) => s.place_id === placeId)) return;
    onChange([...stops, { place_id: placeId, name, order: stops.length + 1 }]);
  };

  const removeStop = (placeId: number) => {
    const next = stops
      .filter((s) => s.place_id !== placeId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    onChange(next);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...stops];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    onChange(copy.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <div className="space-y-4 rounded-[22px] border border-stone-900/10 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/95">
      <div>
        <h3 className="font-display text-base font-bold text-heritage-ink dark:text-stone-50">Rotanızı oluşturun</h3>
        <p className="mt-1 text-xs text-stone-500">
          En az 2 durak seçin. Rehberler bu güzergaha göre teklif verir.
        </p>
      </div>

      {stops.length > 0 ? (
        <ol className="space-y-2">
          {stops.map((stop, index) => (
            <li
              key={stop.place_id}
              className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {index + 1}
              </span>
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{stop.name}</span>
              <button
                className="tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-500 hover:bg-stone-200/80 dark:hover:bg-zinc-700"
                type="button"
                aria-label="Yukarı taşı"
                onClick={() => moveUp(index)}
              >
                <GripVertical className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                className="tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-heritage-ember"
                type="button"
                aria-label="Kaldır"
                onClick={() => removeStop(stop.place_id)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-stone-500">Henüz durak yok</p>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Durak ekle</p>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-stone-200 dark:bg-zinc-800" />
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {places.slice(0, 40).map((p) => {
              const selected = stops.some((s) => s.place_id === p.place_id);
              return (
                <li key={p.place_id}>
                  <button
                    className={`tap-scale flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm ${
                      selected
                        ? 'bg-stone-100 opacity-50 dark:bg-zinc-800'
                        : 'hover:bg-stone-50 dark:hover:bg-zinc-800/80'
                    }`}
                    disabled={selected}
                    type="button"
                    onClick={() => addPlace(p.place_id, p.name)}
                  >
                    <span className="truncate font-medium">{p.name}</span>
                    {!selected ? <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
