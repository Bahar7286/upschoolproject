import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listCities, listDistrictsByCity } from '../../../services/city-service';
import { fetchGeoCenter } from '../../../services/google-service';
import { isValidMapCenter, parseOptionalCoord } from '../../../utils/map-coords';

type MapSessionParams = {
  effectiveCityName: string;
  district: string | null;
  cityIdParam: number;
  districtIdParam: number;
  destLatParam: string | null;
  destLngParam: string | null;
};

export function useMapSession({
  effectiveCityName,
  district,
  cityIdParam,
  districtIdParam,
  destLatParam,
  destLngParam,
}: MapSessionParams) {
  const destLat = parseOptionalCoord(destLatParam);
  const destLng = parseOptionalCoord(destLngParam);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 60 * 60 * 1000,
  });

  const resolvedCityId = useMemo(() => {
    if (Number.isFinite(cityIdParam) && cityIdParam > 0) return cityIdParam;
    const norm = (s: string) =>
      s
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    const cityNorm = norm(effectiveCityName);
    const match = cities.find((c) => norm(c.name_tr) === cityNorm || norm(c.slug) === cityNorm);
    return match?.city_id ?? 0;
  }, [cities, cityIdParam, effectiveCityName]);

  const cityFallbackCenter = useMemo(() => {
    if (!resolvedCityId) return null;
    const c = cities.find((x) => x.city_id === resolvedCityId);
    if (!c) return null;
    const center = { lat: c.center_lat, lng: c.center_lng };
    return isValidMapCenter(center) ? center : null;
  }, [cities, resolvedCityId]);

  const { data: districts = [] } = useQuery({
    queryKey: ['districts', resolvedCityId],
    queryFn: () => listDistrictsByCity(resolvedCityId!),
    enabled: Boolean(resolvedCityId && resolvedCityId > 0),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const resolvedDistrictName = useMemo(() => {
    if (district?.trim()) return district;
    if (districtIdParam > 0) {
      return districts.find((d) => d.district_id === districtIdParam)?.name_tr ?? '';
    }
    return '';
  }, [district, districtIdParam, districts]);

  const { data: geoCenter } = useQuery({
    queryKey: ['geo-center', resolvedCityId, districtIdParam],
    queryFn: () =>
      fetchGeoCenter({
        cityId: districtIdParam > 0 ? undefined : resolvedCityId,
        districtId: districtIdParam > 0 ? districtIdParam : undefined,
      }),
    enabled: Boolean((resolvedCityId && resolvedCityId > 0) || districtIdParam > 0),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const mapCenter = useMemo(() => {
    if (destLat != null && destLng != null) {
      const dest = { lat: destLat, lng: destLng };
      if (isValidMapCenter(dest)) return dest;
    }
    if (geoCenter && isValidMapCenter(geoCenter)) {
      return { lat: geoCenter.lat, lng: geoCenter.lng };
    }
    if (cityFallbackCenter) return cityFallbackCenter;
    return { lat: 41.015137, lng: 28.97953 };
  }, [geoCenter, destLat, destLng, cityFallbackCenter]);

  const mapZoom = useMemo(() => {
    if (destLat != null) return 15;
    if (districtIdParam > 0) return 14;
    return 12;
  }, [destLat, districtIdParam]);

  return {
    cities,
    districts,
    resolvedCityId,
    resolvedDistrictName,
    geoCenter,
    mapCenter,
    mapZoom,
    destLat,
    destLng,
  };
}
