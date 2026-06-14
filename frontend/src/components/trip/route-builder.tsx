import { useQuery } from '@tanstack/react-query';
import { GripVertical, MapPin, Plus, X } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { usePlacesQuery } from '../../hooks/use-places-query';
import { useI18n } from '../../lib/i18n';
import { listCities, listDistrictsByCity } from '../../services/city-service';
import { fetchGeoCenter } from '../../services/google-service';
import { fetchRegionGooglePlaces } from '../../services/region-venues-service';
import type { PlannedStop } from '../../services/trip-request-service';
import type { GooglePlaceSummary } from '../../types/google';
import type { PlaceCategory } from '../../types/place';

type Props = {
  stops: PlannedStop[];
  onChange: (stops: PlannedStop[]) => void;
  defaultCity?: string;
};

type PickablePlace = {
  place_id: number;
  name: string;
  district: string;
};

const ROUTE_CATEGORIES: PlaceCategory[] = ['historical', 'mosque', 'museum', 'palace', 'bazaar'];

function hashGooglePlaceId(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) + 1_000_000_000;
}

function mergePickablePlaces(
  dbPlaces: { place_id: number; name: string; district: string }[],
  googlePlaces: { place_id: string; name: string; address: string }[],
): PickablePlace[] {
  const seenNames = new Set(dbPlaces.map((p) => p.name.toLocaleLowerCase('tr-TR')));
  const usedIds = new Set(dbPlaces.map((p) => p.place_id));
  const out: PickablePlace[] = dbPlaces.map((p) => ({
    place_id: p.place_id,
    name: p.name,
    district: p.district,
  }));

  for (const gp of googlePlaces) {
    const nameKey = gp.name.toLocaleLowerCase('tr-TR');
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);
    let id = hashGooglePlaceId(gp.place_id || gp.name);
    while (usedIds.has(id)) id += 1;
    usedIds.add(id);
    const district = gp.address?.split(',')[0]?.trim() || '';
    out.push({ place_id: id, name: gp.name, district });
  }

  return out;
}

export function RouteBuilder({ stops, onChange, defaultCity = 'İstanbul' }: Props): ReactElement {
  const { t } = useI18n();
  const [cityName, setCityName] = useState(defaultCity);
  const [districtName, setDistrictName] = useState('');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const selectedCity = useMemo(
    () => cities.find((c) => c.name_tr === cityName) ?? cities.find((c) => c.name_tr === defaultCity) ?? null,
    [cities, cityName, defaultCity],
  );

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedCity?.city_id ?? 0],
    queryFn: () => listDistrictsByCity(selectedCity!.city_id),
    enabled: Boolean(selectedCity?.city_id),
    staleTime: 60 * 60 * 1000,
  });

  const { data: dbPlaces = [], isLoading: dbLoading } = usePlacesQuery(
    null,
    selectedCity?.name_tr ?? cityName,
    districtName || null,
  );

  const { data: geoCenter } = useQuery({
    queryKey: ['route-builder-geo', selectedCity?.city_id, districtName],
    queryFn: async () => {
      const district = districts.find((d) => d.name_tr === districtName);
      if (district?.district_id) {
        return fetchGeoCenter({ districtId: district.district_id });
      }
      return fetchGeoCenter({ cityId: selectedCity!.city_id });
    },
    enabled: Boolean(selectedCity?.city_id),
    staleTime: 60 * 60 * 1000,
  });

  const { data: googlePlaces = [], isLoading: googleLoading } = useQuery({
    queryKey: [
      'route-builder-google',
      geoCenter?.lat,
      geoCenter?.lng,
      selectedCity?.name_tr,
      districtName,
    ],
    queryFn: async () => {
      const merged = new Map<string, GooglePlaceSummary>();
      for (const category of ROUTE_CATEGORIES) {
        const batch = await fetchRegionGooglePlaces({
          lat: geoCenter!.lat,
          lng: geoCenter!.lng,
          cityName: selectedCity!.name_tr,
          districtName: districtName || undefined,
          category,
        });
        for (const p of batch) {
          if (p.place_id) merged.set(p.place_id, p);
        }
        if (merged.size >= 24) break;
      }
      return [...merged.values()];
    },
    enabled: Boolean(geoCenter && selectedCity?.name_tr),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const places = useMemo(
    () => mergePickablePlaces(dbPlaces, googlePlaces),
    [dbPlaces, googlePlaces],
  );

  const isLoading = dbLoading || (places.length === 0 && googleLoading);

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
        <h3 className="font-display text-base font-bold text-heritage-ink dark:text-stone-50">
          {t('routeBuilder.title', 'Rotanızı oluşturun')}
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          {t('routeBuilder.hint', 'En az 2 durak seçin. Rehberler bu güzergaha göre teklif verir.')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
          {t('routeBuilder.city', 'İl')}
          <select
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            value={selectedCity?.name_tr ?? cityName}
            onChange={(e) => {
              setCityName(e.target.value);
              setDistrictName('');
            }}
          >
            {cities.map((c) => (
              <option key={c.city_id} value={c.name_tr}>
                {c.name_tr}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wide text-stone-500">
          {t('routeBuilder.district', 'İlçe')}
          <select
            className="theme-input mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            value={districtName}
            onChange={(e) => setDistrictName(e.target.value)}
          >
            <option value="">{t('routeBuilder.allDistricts', 'Tüm ilçeler')}</option>
            {districts.map((d) => (
              <option key={d.district_id} value={d.name_tr}>
                {d.name_tr}
              </option>
            ))}
          </select>
        </label>
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
                aria-label={t('routeBuilder.moveUp', 'Yukarı taşı')}
                onClick={() => moveUp(index)}
              >
                <GripVertical className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                className="tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-heritage-ember"
                type="button"
                aria-label={t('routeBuilder.remove', 'Kaldır')}
                onClick={() => removeStop(stop.place_id)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-stone-500">
          {t('routeBuilder.noStops', 'Henüz durak yok')}
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
          {t('routeBuilder.addStop', 'Durak ekle')}
          {districtName ? ` · ${districtName}` : selectedCity ? ` · ${selectedCity.name_tr}` : ''}
        </p>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-stone-200 dark:bg-zinc-800" />
        ) : places.length === 0 ? (
          <p className="text-xs text-stone-500">{t('routeBuilder.noPlaces', 'Bu filtrede mekan bulunamadı.')}</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {places.slice(0, 50).map((p) => {
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
                    <span className="truncate font-medium">
                      {p.name}
                      <span className="ml-1 text-xs font-normal text-stone-500">· {p.district}</span>
                    </span>
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
