import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Map, UtensilsCrossed } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { listCities, listDistrictsByCity } from '../services/city-service';
import type { PlaceCategory } from '../types/place';

const CATEGORIES: { id: PlaceCategory; label: string; Icon: typeof Map }[] = [
  { id: 'museum', label: 'Gezilecek', Icon: Map },
  { id: 'restaurant', label: 'Yeme-İçme', Icon: UtensilsCrossed },
  { id: 'accommodation', label: 'Konaklama', Icon: Map },
];

export default function CityDetailPage(): ReactElement {
  const { cityId } = useParams();
  const id = Number(cityId);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const city = useMemo(() => cities.find((c) => c.city_id === id) ?? null, [cities, id]);

  const { data: districts = [], isPending, isError } = useQuery({
    queryKey: ['districts', id],
    queryFn: () => listDistrictsByCity(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 60 * 60 * 1000,
  });

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <section className="mx-auto max-w-3xl">
        <p className="text-sm">Geçersiz şehir.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="city-title">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">
          {city ? `Plaka ${city.plate_code}` : 'Şehir'}
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="city-title">
          {city?.name_tr ?? 'Yükleniyor…'}
        </h1>
        <p className="text-sm text-theme-muted">İlçe seç → mekanları gör</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ id: catId, label, Icon }) => (
          <Link
            key={catId}
            to={`/cities/${id}/places?category=${encodeURIComponent(catId)}`}
            className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 text-sm font-semibold text-stone-800 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
        <Link
          to={`/map?city=${encodeURIComponent(city?.name_tr ?? 'Istanbul')}`}
          className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white"
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Haritada aç
        </Link>
      </div>

      {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {isError ? (
        <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
          İlçeler yüklenemedi.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {districts.map((d) => (
          <Link
            key={d.district_id}
            to={`/cities/${id}/districts/${d.district_id}`}
            className="theme-card tap-scale flex items-center justify-between rounded-2xl px-4 py-3 hover:shadow-lift"
          >
            <span className="font-semibold text-theme">{d.name_tr}</span>
            <ChevronRight className="h-5 w-5 text-theme-muted" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

