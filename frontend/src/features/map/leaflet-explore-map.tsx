import type { ReactElement } from 'react';

import { useEffect } from 'react';

import { Link } from 'react-router-dom';

import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import L from 'leaflet';



import type { GooglePlaceSummary } from '../../types/google';
import type { PlaceResponse } from '../../types/place';

import { PLACE_CATEGORY_LABELS } from '../../types/place';

import type { StopResponse } from '../../types/stop';

import type { RouteResponse } from '../../types/route';

import { ensureLeafletDefaultIcons } from './leaflet-default-icons';

import { OSM_ATTRIBUTION, OSM_TILE_URL, TURKEY_MAP_CENTER, placeCategoryIcon } from './map-config';



function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {

  const map = useMap();

  useEffect(() => {

    map.flyTo([lat, lng], 14, { duration: 1.2 });

  }, [lat, lng, map]);

  return null;

}



function FlyToStop({ stop }: { stop: StopResponse | null }) {

  const map = useMap();

  useEffect(() => {

    if (stop) {

      map.flyTo([stop.latitude, stop.longitude], 15, { duration: 1 });

    }

  }, [stop, map]);

  return null;

}



function FitRouteBounds({ stops }: { stops: StopResponse[] }) {

  const map = useMap();

  useEffect(() => {

    if (stops.length >= 2) {

      const bounds = L.latLngBounds(stops.map((s) => [s.latitude, s.longitude] as [number, number]));

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });

    }

  }, [stops, map]);

  return null;

}



const stopIcon = L.divIcon({

  className: '',

  html: '<div style="width:14px;height:14px;border-radius:50%;background:#c9a227;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',

  iconSize: [14, 14],

  iconAnchor: [7, 7],

});



function FlyToCenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.85 });
  }, [lat, lng, zoom, map]);
  return null;
}

function MapPickHandler({
  active,
  onPick,
}: {
  active: boolean;
  onPick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!active || !onPick) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}



export function LeafletExploreMap({

  routes,

  places = [],

  userLocation = null,

  activeStops = [],

  focusRouteId,

  showPlaces = true,

  center,

  zoom = 12,

  googlePlaces = [],

  onMapPick,

  mapPickActive = false,

}: {

  routes: RouteResponse[];

  places?: PlaceResponse[];

  userLocation?: { lat: number; lng: number } | null;

  activeStops?: StopResponse[];

  focusRouteId?: number;

  showPlaces?: boolean;

  center?: { lat: number; lng: number };

  zoom?: number;

  googlePlaces?: GooglePlaceSummary[];

  onMapPick?: (lat: number, lng: number) => void;

  mapPickActive?: boolean;

}): ReactElement {

  useEffect(() => {

    ensureLeafletDefaultIcons();

  }, []);



  const focusStop = activeStops[0] ?? null;

  const routeLine = activeStops.map((s) => [s.latitude, s.longitude] as [number, number]);

  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : TURKEY_MAP_CENTER;



  return (

    <div className="relative h-[min(52vh,400px)] min-h-[280px] w-full overflow-hidden rounded-2xl border border-stone-900/10 shadow-lift sm:h-[min(62vh,480px)] sm:min-h-[320px] lg:h-[min(70vh,560px)] dark:border-white/10 dark:shadow-lift-dark">

      <MapContainer center={mapCenter} zoom={zoom} className="z-0 h-full w-full min-h-[280px]" scrollWheelZoom>

        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <MapPickHandler active={mapPickActive} onPick={onMapPick} />

        {center ? <FlyToCenter lat={center.lat} lng={center.lng} zoom={zoom} /> : null}

        {userLocation ? <FlyToLocation lat={userLocation.lat} lng={userLocation.lng} /> : null}

        {focusStop ? <FlyToStop stop={focusStop} /> : null}

        {activeStops.length >= 2 ? <FitRouteBounds stops={activeStops} /> : null}



        {userLocation ? (

          <CircleMarker

            center={[userLocation.lat, userLocation.lng]}

            radius={10}

            pathOptions={{ color: '#1db954', fillColor: '#1db954', fillOpacity: 0.85, weight: 2 }}

          >

            <Popup>Konumunuz</Popup>

          </CircleMarker>

        ) : null}



        {activeStops.length >= 2 ? (

          <Polyline pathOptions={{ color: '#c9a227', weight: 4, opacity: 0.85 }} positions={routeLine} />

        ) : null}



        {activeStops.map((stop, index) => (

          <Marker key={`stop-${stop.stop_id}`} position={[stop.latitude, stop.longitude]} icon={stopIcon}>

            <Popup>

              <div className="min-w-[160px] space-y-1 p-1 font-sans text-sm">

                <div className="text-xs font-bold text-amber-700">Durak {index + 1}</div>

                <div className="font-bold">{stop.title}</div>

                <div className="text-xs text-stone-600">{stop.description?.slice(0, 100)}</div>

              </div>

            </Popup>

          </Marker>

        ))}



        {showPlaces

          ? places.map((place) => (

              <Marker

                key={`place-${place.place_id}`}

                position={[place.latitude, place.longitude]}

                icon={placeCategoryIcon(place.category, place.is_partner)}

              >

                <Popup>

                  <div className="min-w-[180px] space-y-1 p-1 font-sans text-sm">

                    <div className="text-xs font-bold uppercase text-stone-500">

                      {PLACE_CATEGORY_LABELS[place.category]}

                      {place.is_partner ? ' · Partner' : ''}

                    </div>

                    <div className="font-bold">{place.name}</div>

                    <div className="text-xs text-stone-600">{place.district}</div>

                    <div className="text-xs text-stone-600">{place.description.slice(0, 90)}…</div>
                    <Link
                      className="mt-2 inline-block font-semibold text-primary underline"
                      to={`/places/${place.place_id}`}
                    >
                      Detaylı bilgi ve ses →
                    </Link>

                  </div>

                </Popup>

              </Marker>

            ))

          : null}



        {showPlaces && googlePlaces.length > 0
          ? googlePlaces.map((gp, idx) => {
              const popular = idx < 10;
              const radius = popular ? 10 : 7;
              const ratingLabel =
                gp.rating != null
                  ? `⭐ ${gp.rating}${gp.user_rating_count ? ` (${gp.user_rating_count})` : ''}`
                  : null;
              return (
              <CircleMarker
                key={`gplace-${gp.place_id}`}
                center={[gp.lat, gp.lng]}
                radius={radius}
                pathOptions={{
                  color: popular ? '#92400e' : '#b45309',
                  fillColor: popular ? '#f59e0b' : '#d97706',
                  fillOpacity: popular ? 0.95 : 0.88,
                  weight: popular ? 2.5 : 2,
                }}
              >
                <Popup>
                  <div className="min-w-[160px] space-y-1 p-1 font-sans text-sm">
                    <div className="font-bold">{gp.name}</div>
                    {ratingLabel ? (
                      <div className="text-xs font-semibold text-amber-700">{ratingLabel}</div>
                    ) : null}
                    <div className="text-xs text-stone-600">{gp.address}</div>
                    <Link
                      className="mt-1 inline-block font-semibold text-primary underline"
                      to={`/google-places/${encodeURIComponent(gp.place_id)}`}
                    >
                      Detay →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
            })
          : null}



        {!activeStops.length

          ? routes

              .filter((route) => !focusRouteId || route.route_id === focusRouteId)

              .map((route) => {

                const linkedPlace = places.find((p) =>

                  route.title.toLowerCase().includes(p.name.split(' ')[0]?.toLowerCase() ?? ''),

                );

                const lat = linkedPlace?.latitude ?? TURKEY_MAP_CENTER[0];

                const lng = linkedPlace?.longitude ?? TURKEY_MAP_CENTER[1];

                return (

                  <Marker key={route.route_id} position={[lat, lng]}>

                    <Popup>

                      <div className="min-w-[170px] space-y-2 p-1 font-sans text-sm text-stone-900">

                        <div className="font-bold leading-snug">{route.title}</div>

                        <div className="text-xs text-stone-600">{route.city}</div>

                        <Link className="font-semibold text-primary underline" to={`/routes/${route.route_id}`}>

                          Rotayı aç

                        </Link>

                      </div>

                    </Popup>

                  </Marker>

                );

              })

          : null}

      </MapContainer>

      {mapPickActive ? (
        <p className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg bg-amber-100/95 px-3 py-2 text-center text-xs font-bold text-amber-950 shadow dark:bg-amber-950/90 dark:text-amber-100">
          Haritaya dokunarak ara durak ekleyin
        </p>
      ) : null}

    </div>

  );

}


