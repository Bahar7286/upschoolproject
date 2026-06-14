import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { formatApiError } from '../../lib/api';
import { fetchGeoCenter } from '../../services/google-service';
import { fetchRegionGooglePlaces } from '../../services/region-venues-service';
import { listPlaces } from '../../services/place-service';
import type { PlaceCategory } from '../../types/place';
import { GoogleExploreMap } from './google-explore-map';
import { LeafletRegionMap } from './leaflet-region-map';

export interface RegionInlineMapProps {
  cityId: number;
  districtId?: number;
  cityName?: string;
  districtName?: string;
  category?: PlaceCategory | null;
  /** district/city tablosundan merkez (geo API yedek) */
  fallbackCenter?: { lat: number; lng: number };
  /** Veritabanı mekan sayısını etikette göster */
  showDbCount?: boolean;
}

export function RegionInlineMap({
  cityId,
  districtId,
  cityName,
  districtName,
  category,
  fallbackCenter,
  showDbCount,
}: RegionInlineMapProps): ReactElement {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const isDistrict = Boolean(districtId && districtId > 0);
  const zoom = isDistrict ? 14 : 11;

  const { data: geoCenter, isLoading: geoLoading } = useQuery({
    queryKey: ['geo-center', cityId, districtId ?? 0],
    queryFn: () =>
      fetchGeoCenter({
        cityId: isDistrict ? undefined : cityId,
        districtId: isDistrict ? districtId : undefined,
      }),
    enabled: cityId > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const center = useMemo(() => {
    if (geoCenter && geoCenter.lat && geoCenter.lng) {
      return { lat: geoCenter.lat, lng: geoCenter.lng };
    }
    if (fallbackCenter && fallbackCenter.lat && fallbackCenter.lng) {
      return fallbackCenter;
    }
    return { lat: 39.0, lng: 35.0 };
  }, [geoCenter, fallbackCenter]);

  const { data: dbPlaces = [] } = useQuery({
    queryKey: ['db-places-count', cityName, districtName, category],
    queryFn: () =>
      listPlaces({
        city: cityName,
        district: districtName,
        category: category ?? undefined,
        limit: 200,
      }),
    enabled: showDbCount && Boolean(cityName),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: nearbyPlaces = [],
    isFetching: placesLoading,
    error: placesError,
  } = useQuery({
    queryKey: ['google-nearby-inline', center.lat, center.lng, category, cityName, districtName],
    queryFn: () =>
      fetchRegionGooglePlaces({
        lat: center.lat,
        lng: center.lng,
        cityName: cityName ?? geoCenter?.city_name ?? '',
        districtName: districtName ?? geoCenter?.district_name,
        category: category ?? 'museum',
      }),
    enabled: Boolean(cityName || geoCenter?.city_name),
    staleTime: 30 * 60 * 1000,
    retry: 1,
    throwOnError: false,
  });

  const mapLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set('cityId', String(cityId));
    if (cityName) params.set('city', cityName);
    if (districtId) params.set('districtId', String(districtId));
    if (districtName) params.set('district', districtName);
    if (category) params.set('category', category);
    return `/map?${params.toString()}`;
  }, [cityId, cityName, districtId, districtName, category]);

  const regionLabel =
    geoCenter?.district_name && geoCenter?.city_name
      ? `${geoCenter.district_name}, ${geoCenter.city_name}`
      : districtName && cityName
        ? `${districtName}, ${cityName}`
        : cityName ?? 'Bölge';

  return (
    <div className="space-y-2" aria-label={`${regionLabel} haritası`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
          {geoLoading ? 'Harita yükleniyor…' : regionLabel}
          {nearbyPlaces.length > 0 ? ` · ${nearbyPlaces.length} yer` : ''}
          {import.meta.env.DEV && showDbCount && dbPlaces.length > 0
            ? ` · ${dbPlaces.length} katalog`
            : ''}
        </p>
        <Link className="text-xs font-bold text-primary hover:underline" to={mapLink}>
          Tam ekran harita →
        </Link>
      </div>

      {placesError ? (
        <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100" role="alert">
          {formatApiError(placesError)}
          <span className="mt-1 block">Harita verisi şu an alınamadı; listeden mekan seçmeye devam edebilirsin.</span>
        </p>
      ) : null}

      {placesLoading && nearbyPlaces.length === 0 ? (
        <div className="h-[min(42vh,360px)] animate-pulse rounded-2xl bg-stone-200 dark:bg-zinc-800" aria-busy="true" />
      ) : null}

      {googleKey ? (
        <GoogleExploreMap
          routes={[]}
          apiKey={googleKey}
          center={center}
          zoom={zoom}
          googlePlaces={nearbyPlaces}
          compact
        />
      ) : (
        <LeafletRegionMap
          center={center}
          zoom={zoom}
          places={nearbyPlaces}
        />
      )}

      {!googleKey ? (
        <p className="text-xs text-stone-500">
          Google harita için <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY</code> tanımlayın; şimdilik OSM
          gösteriliyor.
        </p>
      ) : null}
    </div>
  );
}
