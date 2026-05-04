import type { ReactElement } from 'react';
import { useState } from 'react';

import type { RouteResponse } from '../../types/route';
import { GoogleExploreMap } from './google-explore-map';
import { LeafletExploreMap } from './leaflet-explore-map';

type Engine = 'leaflet' | 'google';

export function ExploreMap({ routes }: { routes: RouteResponse[] }): ReactElement {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [engine, setEngine] = useState<Engine>('leaflet');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          Varsayılan: <strong>OpenStreetMap</strong> (Leaflet). Google için kök dizinde{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
          tanımlayın.
        </p>
        <div className="inline-flex rounded-full border border-stone-900/10 bg-white/70 p-1 shadow-sm backdrop-blur">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              engine === 'leaflet' ? 'bg-heritage-ink text-white shadow' : 'text-stone-600 hover:bg-stone-100'
            }`}
            onClick={() => setEngine('leaflet')}
          >
            OSM / Leaflet
          </button>
          <button
            type="button"
            disabled={!googleKey}
            title={googleKey ? 'Google Haritalar' : 'VITE_GOOGLE_MAPS_API_KEY tanımlı değil'}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              engine === 'google' ? 'bg-heritage-ink text-white shadow' : 'text-stone-600 hover:bg-stone-100'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={() => googleKey && setEngine('google')}
          >
            Google
          </button>
        </div>
      </div>

      {engine === 'leaflet' ? <LeafletExploreMap routes={routes} /> : null}
      {engine === 'google' && googleKey ? <GoogleExploreMap routes={routes} apiKey={googleKey} /> : null}
    </div>
  );
}
