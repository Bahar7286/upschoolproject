import type { ReactElement } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

import type { RouteResponse } from '../../types/route';
import { routeMapPosition } from './route-map-position';

const containerStyle: { width: string; height: string } = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 41.015137, lng: 28.97953 };

export function GoogleExploreMap({
  routes,
  apiKey,
}: {
  routes: RouteResponse[];
  apiKey: string;
}): ReactElement {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'historial-google-maps-script',
    googleMapsApiKey: apiKey,
    version: 'weekly',
  });

  if (loadError) {
    return (
      <div className="flex h-[min(52vh,400px)] sm:h-[min(62vh,480px)] lg:h-[min(70vh,560px)] items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 text-center text-sm text-red-800">
        Google Haritalar yüklenemedi. API anahtarı, faturalandırma ve Maps JavaScript API etkinliğini kontrol edin.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="h-[min(52vh,400px)] sm:h-[min(62vh,480px)] lg:h-[min(70vh,560px)] animate-pulse rounded-2xl bg-stone-200"
        aria-busy="true"
        aria-label="Harita yükleniyor"
      />
    );
  }

  return (
    <div className="relative h-[min(52vh,400px)] sm:h-[min(62vh,480px)] lg:h-[min(70vh,560px)] w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-lift">
      <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={12} mapContainerClassName="rounded-2xl">
        {routes.map((route) => {
          const { lat, lng } = routeMapPosition(route.route_id);
          return <Marker key={route.route_id} position={{ lat, lng }} title={route.title} />;
        })}
      </GoogleMap>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-xs text-stone-700 shadow-md backdrop-blur">
        Google Maps — işaretçiler backend rotalarından üretilen demo konumlardır.
      </div>
    </div>
  );
}
