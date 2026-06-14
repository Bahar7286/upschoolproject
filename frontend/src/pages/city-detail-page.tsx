import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CategoryIconCard } from '../components/explore/category-icon-card';
import { DistrictRowCard } from '../components/explore/district-row-card';
import { BackButton } from '../components/ui/back-button';
import { RegionInlineMap } from '../features/map/region-inline-map';

import { useI18n } from '../lib/i18n';
import { usePlaceCategoryLabels } from '../hooks/use-place-category-labels';
import { listCities, listDistrictsByCity } from '../services/city-service';
import { listPlaces } from '../services/place-service';
import type { PlaceCategory } from '../types/place';

const CATEGORIES: { id: PlaceCategory; labelKey: string; emoji: string }[] = [
  { id: 'museum', labelKey: 'city.sightseeing', emoji: '🏛️' },
  { id: 'historical', labelKey: 'city.sightseeing', emoji: '🏰' },
  { id: 'mosque', labelKey: 'district.museum', emoji: '🕌' },
  { id: 'restaurant', labelKey: 'city.food', emoji: '🍽️' },
  { id: 'accommodation', labelKey: 'city.stay', emoji: '🛏️' },
];

export default function CityDetailPage(): ReactElement {
  const { t } = useI18n();
  const categoryLabels = usePlaceCategoryLabels();
  const { cityId } = useParams();
  const id = Number(cityId);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const city = useMemo(() => cities.find((c) => c.city_id === id) ?? null, [cities, id]);

  const { data: districts = [], isPending, isError, refetch } = useQuery({
    queryKey: ['districts', id],
    queryFn: () => listDistrictsByCity(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 60 * 60 * 1000,
  });

  const { data: cityPlaces = [] } = useQuery({
    queryKey: ['city-places-all', city?.name_tr],
    queryFn: () => listPlaces({ city: city!.name_tr, limit: 500 }),
    enabled: Boolean(city?.name_tr),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });

  const placeCountByDistrict = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of cityPlaces) {
      m.set(p.district, (m.get(p.district) ?? 0) + 1);
    }
    return m;
  }, [cityPlaces]);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <section className="mx-auto max-w-3xl">
        <p className="text-sm">{t('cityDetail.invalidCity', 'Geçersiz şehir.')}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5 pb-6" aria-labelledby="city-title">
      <BackButton to="/cities" />

      <header className="space-y-1 px-1">
        {city?.plate_code ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Plaka {city.plate_code}</p>
        ) : null}
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="city-title">
          {city?.name_tr ?? t('cityDetail.loadingName', 'Yükleniyor…')}
        </h1>
        <p className="text-sm text-theme-muted">{t('city.pickDistrict', 'İlçe seç → mekanları gör')}</p>
      </header>

      <p className="px-1 text-xs font-bold uppercase tracking-wide text-primary">{t('city.categories', 'Mekan türleri')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map(({ id: catId, labelKey, emoji }) => (
          <CategoryIconCard
            key={catId}
            to={`/cities/${id}/places?category=${catId}`}
            label={t(labelKey, catId)}
            emoji={emoji}
          />
        ))}
        <Link
          to={`/map?cityId=${id}&city=${encodeURIComponent(city?.name_tr ?? '')}`}
          className="tap-scale col-span-2 flex min-h-[52px] items-center justify-center rounded-2xl bg-primary px-4 text-center text-sm font-bold text-white shadow-sm sm:col-span-3"
        >
          {t('map.openInMap', 'Haritada aç')}
        </Link>
      </div>

      <div className="space-y-3" aria-labelledby="districts-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="font-display text-lg font-bold text-theme" id="districts-heading">
            {t('city.districts', 'İlçeler')}
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t('city.districtCount', '{count} İlçe').replace('{count}', String(districts.length))}
          </span>
        </div>

        {isPending ? <div className="h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" /> : null}
        {isError ? (
          <div className="alert-error space-y-2 rounded-xl px-3 py-2 text-sm" role="alert">
            <p>{t('cityDetail.districtLoadError', 'İlçe listesi API\'den alınamadı; yerel liste deneniyor…')}</p>
            <button
              type="button"
              className="font-bold text-primary underline"
              onClick={() => void refetch()}
            >
              {t('city.retry', 'Yeniden dene')}
            </button>
          </div>
        ) : null}
        {!isPending && districts.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
            {t('cityDetail.noDistricts', 'Bu il için ilçe listesi şu an yüklenemedi. Lütfen biraz sonra sayfayı yenileyin.')}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {districts.map((d) => (
            <DistrictRowCard
              key={d.district_id}
              citySlug={city?.slug ?? ''}
              districtId={d.district_id}
              districtSlug={d.slug}
              name={d.name_tr}
              placeCount={placeCountByDistrict.get(d.name_tr) ?? 0}
              imageUrl={d.image_url}
              to={`/cities/${id}/districts/${d.district_id}`}
            />
          ))}
        </div>
      </div>

      {city ? (
        <section className="space-y-2" aria-labelledby="map-heading">
          <h2 className="sr-only" id="map-heading">
            {t('cityDetail.mapSummary', 'Harita özeti')}
          </h2>
          <RegionInlineMap
            cityId={city.city_id}
            cityName={city.name_tr}
            fallbackCenter={{ lat: city.center_lat, lng: city.center_lng }}
            showDbCount
          />
        </section>
      ) : null}

      <section className="space-y-2 px-1" aria-labelledby="categories-heading">
        <h2 className="font-display text-sm font-bold text-theme-muted" id="categories-heading">
          {t('cityDetail.cityWide', {
            museum: categoryLabels.museum,
            restaurant: categoryLabels.restaurant,
            accommodation: categoryLabels.accommodation,
          }, 'Şehir geneli · {museum} / {restaurant} / {accommodation}')}
        </h2>
        <p className="text-xs text-theme-muted">
          {t('cityDetail.categoryHint', 'İlçe seçmeden şehir genelinde aramak için yukarıdaki kategori düğmelerini kullanın.')}
        </p>
      </section>
    </section>
  );
}
