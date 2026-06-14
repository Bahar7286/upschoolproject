import { LocateFixed, Navigation, Play } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../../lib/i18n';
import type { MergedRouteStop } from '../../../lib/merge-route-stops';
import { ActiveRoutePlanner } from '../../active-route/active-route-planner';

type Props = {
  focusRouteId: number | undefined;
  routeTitle: string;
  mergedStops: MergedRouteStop[];
  currentStopIndex: number;
  setCurrentStopIndex: (index: number) => void;
  currentStop: MergedRouteStop | null;
  nextStop: MergedRouteStop | null;
  routeNavActive: boolean;
  userLocation: { lat: number; lng: number } | null;
  geoError: string;
  completeMsg: string;
  geofenceMessage: string;
  watching: boolean;
  busy: boolean;
  accessToken: string | null;
  mapPickActive: boolean;
  setMapPickActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  mapPickMsg: string;
  setMapPickMsg: (msg: string) => void;
  onShowMyLocation: () => void;
  onStartRoute: () => void;
  onCompleteRoute: () => void;
  onResetRoute: () => void;
};

export function MapActiveRouteSection({
  focusRouteId,
  routeTitle,
  mergedStops,
  currentStopIndex,
  setCurrentStopIndex,
  currentStop,
  nextStop,
  routeNavActive,
  userLocation,
  geoError,
  completeMsg,
  geofenceMessage,
  watching,
  busy,
  accessToken,
  mapPickActive,
  setMapPickActive,
  mapPickMsg,
  setMapPickMsg,
  onShowMyLocation,
  onStartRoute,
  onCompleteRoute,
  onResetRoute,
}: Props): ReactElement {
  const { t } = useI18n();

  return (
    <>
      {geoError ? (
        <div
          className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-950 dark:text-amber-100"
          role="alert"
        >
          <p>{geoError}</p>
          <p className="mt-2 text-stone-700 dark:text-stone-300">
            Konum olmadan da haritayı kullanabilirsin. Şehir seçerek veya listeden mekanlara göz atarak devam et.
          </p>
          <Link className="mt-2 inline-flex min-h-[44px] items-center font-bold text-primary underline" to="/cities">
            İlleri liste görünümünde keşfet
          </Link>
        </div>
      ) : null}

      {geofenceMessage ? (
        <div
          className="break-anywhere rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary-dark dark:text-primary"
          role="status"
        >
          {watching ? '📍 ' : ''}
          {geofenceMessage}
        </div>
      ) : null}

      {completeMsg ? (
        <div
          className="break-anywhere rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-950 dark:text-amber-100"
          role="status"
        >
          {completeMsg}
        </div>
      ) : null}

      <div className="responsive-stack">
        <button
          className="tap-scale responsive-btn rounded-xl border-2 border-stone-300 bg-white px-5 text-sm font-semibold hover:border-stone-900 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-white"
          type="button"
          onClick={onShowMyLocation}
        >
          <LocateFixed className="h-5 w-5" aria-hidden="true" />
          {t('map.myLocation', 'Konumumu göster')}
        </button>

        {focusRouteId != null && mergedStops.length > 0 ? (
          <>
            {!routeNavActive ? (
              <button
                className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                type="button"
                onClick={onStartRoute}
              >
                <Play className="h-5 w-5" aria-hidden="true" />
                {t('map.startRoute', 'Rotaya başla')}
              </button>
            ) : (
              <button
                className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-60"
                type="button"
                disabled={currentStopIndex >= mergedStops.length - 1}
                onClick={() => setCurrentStopIndex(Math.min(currentStopIndex + 1, mergedStops.length - 1))}
              >
                <Navigation className="h-5 w-5" aria-hidden="true" />
                {t('map.nextStop', 'Sonraki durak')}
              </button>
            )}

            {routeNavActive ? (
              <>
                <button
                  className="tap-scale responsive-btn rounded-xl border-2 border-stone-400 px-5 text-sm font-semibold hover:border-stone-900 dark:border-zinc-500"
                  type="button"
                  onClick={onResetRoute}
                >
                  {t('map.resetRoute', 'Rotayı sıfırla')}
                </button>
                <button
                  className="tap-scale responsive-btn rounded-xl border-2 border-primary px-5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                  type="button"
                  disabled={busy || !accessToken || focusRouteId === 0}
                  onClick={() => void onCompleteRoute()}
                >
                  {busy ? t('map.saving', 'Kaydediliyor…') : t('map.completeRoute', 'Rotayı tamamla')}
                </button>
              </>
            ) : null}
          </>
        ) : (
          <Link
            className="tap-scale responsive-btn rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
            to="/discover"
          >
            {t('map.pickRoute', 'Rota seç')}
          </Link>
        )}
      </div>

      {focusRouteId && routeTitle ? (
        <div className="rounded-[22px] border border-stone-900/10 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/95 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {t('map.activeRoute', 'Aktif rota')}
          </p>
          <h2 className="mt-1 break-anywhere font-display text-lg font-bold">{routeTitle}</h2>

          <div className="mt-3 grid gap-2 rounded-xl bg-stone-50 p-3 text-sm dark:bg-zinc-800/80">
            <p className="font-semibold text-stone-700 dark:text-stone-200">{t('map.navStatus', 'Navigasyon')}</p>
            <p className="text-stone-600 dark:text-stone-400">
              {userLocation
                ? t('map.youAreHere', 'Konumunuz alındı')
                : t('map.locationPending', 'Konum bekleniyor…')}
              {userLocation ? ` · ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : ''}
            </p>
            {currentStop ? (
              <p className="text-stone-600 dark:text-stone-400">
                {t('map.currentStop', 'Şu anki durak')}: <strong>{currentStop.title}</strong>
                {' · '}
                {t('map.stopOf', 'Durak {current}/{total}')
                  .replace('{current}', String(currentStopIndex + 1))
                  .replace('{total}', String(mergedStops.length))}
              </p>
            ) : null}
            {nextStop ? (
              <p className="text-stone-600 dark:text-stone-400">
                {t('map.headingTo', 'Gidilecek')}: <strong>{nextStop.title}</strong>
              </p>
            ) : null}
          </div>

          {currentStop ? (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {t('map.stopOf', 'Durak {current}/{total}')
                .replace('{current}', String(currentStopIndex + 1))
                .replace('{total}', String(mergedStops.length))}
              : <strong>{currentStop.title}</strong>
            </p>
          ) : null}

          {focusRouteId && mergedStops.length > 0 && routeNavActive ? (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {t('map.geofenceHint', 'Geofence aktif (~20 m) — durağa yaklaşınca sesli anlatım tetiklenir.')}
            </p>
          ) : null}

          {focusRouteId && mergedStops.length > 0 ? (
            <div className="mt-4 border-t border-stone-900/10 pt-4 dark:border-white/10">
              <button
                type="button"
                className={`tap-scale mb-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 px-4 text-sm font-bold ${
                  mapPickActive
                    ? 'border-amber-600 bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'
                    : 'border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/40'
                }`}
                onClick={() => {
                  setMapPickMsg('');
                  setMapPickActive((v) => !v);
                }}
              >
                {mapPickActive
                  ? t('map.cancelMapPick', 'İptal — harita seçimi')
                  : t('map.addWaypoint', 'Ara durak ekle (haritaya dokun)')}
              </button>
              {mapPickActive ? (
                <p className="mb-3 text-xs font-semibold text-amber-800 dark:text-amber-200" role="status">
                  {t('map.mapPickHint', 'Haritada eklemek istediğiniz noktaya dokunun.')}
                </p>
              ) : null}
              {mapPickMsg ? (
                <p
                  className={`mb-3 text-xs font-medium ${mapPickMsg.includes('✓') ? 'text-primary' : 'text-red-700'}`}
                  role="status"
                >
                  {mapPickMsg}
                </p>
              ) : null}
              <ActiveRoutePlanner
                mergedStops={mergedStops}
                currentStopIndex={currentStopIndex}
                onSelectStop={setCurrentStopIndex}
              />
            </div>
          ) : null}

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: mergedStops.length ? `${((currentStopIndex + 1) / mergedStops.length) * 100}%` : '0%' }}
            />
          </div>

          <Link
            className="tap-scale mt-4 inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline"
            to={`/routes/${focusRouteId}`}
          >
            {t('map.routeDetail', 'Rota detayına git')}
          </Link>
        </div>
      ) : null}
    </>
  );
}
