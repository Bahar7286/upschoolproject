import { useQuery } from '@tanstack/react-query';
import { MapPin, Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listCities } from '../services/city-service';

export default function CitiesPage(): ReactElement {
  const [q, setQ] = useState('');
  const { data: cities = [], isPending, isError } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cities;
    return cities.filter((c) => c.name_tr.toLowerCase().includes(needle) || c.plate_code.includes(needle));
  }, [cities, q]);

  return (
    <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="cities-title">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="cities-title">
          81 İl
        </h1>
        <p className="text-sm text-theme-muted">İl seç → ilçeler ve mekanlar</p>
      </header>

      <div className="theme-card flex items-center gap-2 rounded-2xl p-3">
        <Search className="h-5 w-5 text-theme-muted" aria-hidden="true" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="İl ara (örn. İstanbul, 34)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {isError ? (
        <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
          Şehir listesi yüklenemedi.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.city_id}
            to={`/cities/${c.city_id}`}
            className="theme-card tap-scale rounded-2xl p-4 hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">Plaka {c.plate_code}</p>
                <p className="mt-1 truncate font-display text-lg font-extrabold text-theme">{c.name_tr}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

