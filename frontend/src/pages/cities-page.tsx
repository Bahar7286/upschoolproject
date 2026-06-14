import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { CityGridCard } from '../components/explore/city-grid-card';
import { ExploreHero } from '../components/explore/explore-hero';
import { useI18n } from '../lib/i18n';
import { listCities } from '../services/city-service';

export default function CitiesPage(): ReactElement {
  const { t } = useI18n();
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
    <section className="w-full" aria-labelledby="cities-title">
      <ExploreHero
        title={t('cities.title', 'Historial-GO')}
        subtitle={t('cities.subtitle', "Türkiye'nin güzelliklerini keşfet")}
        backTo="/discover"
        badge={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              🏙️ {t('cities.provinceCount', { count: cities.length || 81 }, '{count} İl')}
            </span>
            <Link
              to="/map"
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
            >
              🧭 {t('cities.mapLink', 'Harita')}
            </Link>
          </div>
        }
      >
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-md">
          <Search className="h-5 w-5 shrink-0 text-stone-400" aria-hidden="true" />
          <input
            className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
            placeholder={t('cities.searchPlaceholder', 'İl ara…')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t('cities.searchAria', 'İl ara')}
          />
        </div>
      </ExploreHero>

      <h2 className="sr-only" id="cities-title">
        {t('cities.listTitle', 'İller')}
      </h2>

      {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
      {isError ? (
        <p className="alert-error mx-3 rounded-xl px-3 py-2 text-sm" role="alert">
          {t('cities.loadError', 'Şehir listesi yüklenemedi.')}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 px-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {filtered.map((c) => (
          <CityGridCard
            key={c.city_id}
            cityId={c.city_id}
            name={c.name_tr}
            slug={c.slug}
            plateCode={c.plate_code}
            imageUrl={c.image_url}
            to={`/cities/${c.city_id}`}
          />
        ))}
      </div>
    </section>
  );
}
