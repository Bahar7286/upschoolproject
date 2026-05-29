import type { ReactElement } from 'react';

import { useState } from 'react';

import type { GooglePlaceSummary } from '../../types/google';
import type { PlaceResponse } from '../../types/place';
import type { StopResponse } from '../../types/stop';
import type { RouteResponse } from '../../types/route';
import { GoogleExploreMap } from './google-explore-map';
import { LeafletExploreMap } from './leaflet-explore-map';

type Engine = 'leaflet' | 'google';

export interface ExploreMapProps {
  routes: RouteResponse[];
  places?: PlaceResponse[];
  userLocation?: { lat: number; lng: number } | null;
  activeStops?: StopResponse[];
  focusRouteId?: number;
  currentStopIndex?: number;
  showPlaces?: boolean;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
  googlePlaces?: GooglePlaceSummary[];
  routePolyline?: { lat: number; lng: number }[] | null;
  preferGoogle?: boolean;
}

export function ExploreMap({
  routes,
  places = [],
  userLocation = null,
  activeStops = [],
  focusRouteId,
  currentStopIndex = 0,
  showPlaces = true,
  mapCenter,
  mapZoom = 13,
  googlePlaces = [],
  routePolyline = null,
  preferGoogle = true,
}: ExploreMapProps): ReactElement {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const defaultCenter = mapCenter ?? { lat: 41.015137, lng: 28.97953 };
  const [engine, setEngine] = useState<Engine>(googleKey && preferGoogle ? 'google' : 'leaflet');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {engine === 'google' ? (
            <>
              <strong>Google Haritalar</strong> — canlı mekan pinleri.
            </>
          ) : (
            <>
              <strong>OpenStreetMap</strong> — yerel katalog pinleri.
            </>
          )}
        </p>
        <div className="inline-flex rounded-full border border-stone-900/10 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/70">
          <button
            type="button"
            className={`tap-scale min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition ${
              engine === 'leaflet'
                ? 'bg-heritage-ink text-white shadow dark:bg-stone-100 dark:text-heritage-ink'
                : 'text-stone-600 dark:text-stone-400'
            }`}
            onClick={() => setEngine('leaflet')}
          >
            OSM / Leaflet
          </button>
          <button
            type="button"
            disabled={!googleKey}
            title={googleKey ? 'Google Haritalar' : 'VITE_GOOGLE_MAPS_API_KEY tanımlı değil'}
            className={`tap-scale min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              engine === 'google' ? 'bg-heritage-ink text-white shadow' : 'text-stone-600'
            }`}
            onClick={() => googleKey && setEngine('google')}
          >
            Google
          </button>
        </div>
      </div>

      {engine === 'leaflet' ? (
        <LeafletExploreMap
          routes={routes}
          places={places}
          userLocation={userLocation}
          activeStops={activeStops}
          focusRouteId={focusRouteId}
          showPlaces={showPlaces}
        />
      ) : null}
      {engine === 'google' && googleKey ? (
        <GoogleExploreMap
          routes={routes}
          apiKey={googleKey}
          center={defaultCenter}
          zoom={mapZoom}
          googlePlaces={googlePlaces}
          userLocation={userLocation}
          routePolyline={routePolyline}
          activeStops={activeStops}
          currentStopIndex={currentStopIndex}
        />
      ) : null}
    </div>
  );
}
