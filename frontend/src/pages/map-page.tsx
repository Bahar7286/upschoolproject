import type { ReactElement } from 'react';

import { ExploreMap } from '../features/map/explore-map';
import { useRoutesQuery } from '../hooks/use-routes-query';

export default function MapPage(): ReactElement {
  const { data: routes = [], isPending, isError, error } = useRoutesQuery();

  return (
    <section className="space-y-6" aria-labelledby="map-title">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink md:text-4xl" id="map-title">
          Canlı harita
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-stone-600 md:text-base">
          Leaflet + OpenStreetMap ve isteğe bağlı Google Haritalar. Pin konumları backend’de koordinat olmadığı için İstanbul
          merkezli deterministik örnek dağılımdır; gerçek duraklar rota detayından gelir.
        </p>
      </header>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
          {error instanceof Error ? error.message : 'Rotalar yüklenemedi.'}
        </div>
      ) : null}

      {isPending ? (
        <div
          className="h-[min(70vh,560px)] animate-pulse rounded-2xl bg-stone-200"
          aria-busy="true"
          aria-label="Harita verisi yükleniyor"
        />
      ) : (
        <ExploreMap routes={routes} />
      )}

      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg border-2 border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 transition hover:border-stone-900 min-h-[44px]" type="button">
          Konumumu göster
        </button>
        <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark min-h-[44px]" type="button">
          Aktif rotayı takip et
        </button>
      </div>
    </section>
  );
}
