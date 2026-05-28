import { useQuery } from '@tanstack/react-query';
import { Heart, Map } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { listCities, listDistrictsByCity } from '../services/city-service';
import { listPlaces } from '../services/place-service';
import type { PlaceCategory, PlaceResponse } from '../types/place';
import { PLACE_CATEGORY_LABELS } from '../types/place';

export default function DistrictPlacesPage(): ReactElement {
  const { cityId, districtId } = useParams();
  const city_id = Number(cityId);
  const district_id = Number(districtId);
  const [searchParams] = useSearchParams();
  const category = (searchParams.get('category') as PlaceCategory | null) ?? null;

  const [q, setQ] = useState('');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });
  const city = useMemo(() => cities.find((c) => c.city_id === city_id) ?? null, [cities, city_id]);

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', city_id],
    queryFn: () => listDistrictsByCity(city_id),
    enabled: Number.isFinite(city_id) && city_id > 0,
    staleTime: 60 * 60 * 1000,
  });
  const district = useMemo(
    () => districts.find((d) => d.district_id === district_id) ?? null,
    [districts, district_id],
  );

  const { data: places = [], isPending, isError } = useQuery({
    queryKey: ['district-places', city?.name_tr ?? '', district?.name_tr ?? '', category ?? 'all', q],
    queryFn: () =>
      listPlaces({
        city: city?.name_tr ?? undefined,
        district: district?.name_tr ?? undefined,
        category: category ?? undefined,
        q: q.trim() ? q.trim() : undefined,
        limit: 200,
      }),
    enabled: Boolean(city && district),
    staleTime: 2 * 60 * 1000,
  });

  const title = `${district?.name_tr ?? 'İlçe'} · ${city?.name_tr ?? 'Şehir'}`;

  const mapLink = city && district ? `/map?city=${encodeURIComponent(city.name_tr)}&district=${encodeURIComponent(district.name_tr)}` : '/map';

  return (
    <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="district-title">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="district-title">
          {title}
        </h1>
        <p className="text-sm text-theme-muted">
          {category ? `${PLACE_CATEGORY_LABELS[category]} mekanları` : 'Tüm mekanlar'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          to={mapLink}
          className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white"
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Haritada gör
        </Link>
        <Link
          to="/profile#favorites"
          className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 text-sm font-semibold text-stone-800 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          Favoriler
        </Link>
      </div>

      <div className="theme-card flex items-center gap-2 rounded-2xl p-3">
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Mekan ara"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {isError ? (
        <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
          Mekanlar yüklenemedi.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {places.map((p: PlaceResponse) => (
          <Link key={p.place_id} to={`/places/${p.place_id}`} className="theme-card tap-scale rounded-2xl p-4 hover:shadow-lift">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">{PLACE_CATEGORY_LABELS[p.category]}</p>
            <p className="mt-1 font-display text-lg font-extrabold text-theme">{p.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-theme-muted">{p.description || `${p.district} / ${p.city}`}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

