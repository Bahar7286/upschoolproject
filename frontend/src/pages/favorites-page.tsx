import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff, MapPin } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ListSkeleton } from '../components/loading/page-skeleton';
import { BackButton } from '../components/ui/back-button';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorAlert } from '../components/ui/error-alert';
import { useEmptyStates } from '../hooks/use-empty-states';
import { useI18n } from '../lib/i18n';
import { mapError } from '../lib/user-errors';
import { resolvePlaceImage } from '../lib/region-images';
import { listFavorites, removeFavorite } from '../services/favorite-service';
import { useAuthStore } from '../stores/auth-store';
import { usePlaceCategoryLabels } from '../hooks/use-place-category-labels';

export default function FavoritesPage(): ReactElement {
  const { t } = useI18n();
  const categoryLabels = usePlaceCategoryLabels();
  const emptyStates = useEmptyStates();
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const { data: items = [], isPending, isError, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(accessToken ?? ''),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const removeMut = useMutation({
    mutationFn: async (payload: { entity_type: 'place' | 'route'; entity_id: number }) => {
      await removeFavorite(accessToken ?? '', payload.entity_type, payload.entity_id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const placeItems = items.filter((i) => i.entity_type === 'place' && i.place);

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="text-sm text-theme">{t('favorites.loginRequired', 'Favorileri görmek için giriş yapmalısın.')}</p>
        <Link className="font-bold text-primary" to="/login">
          {t('auth.loginTitle', 'Giriş yap')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-5" aria-labelledby="fav-title">
      <BackButton />
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="fav-title">
          {t('favorites.title', 'Favoriler')}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {t('favorites.subtitle', { count: placeItems.length }, 'Kaydettiğin mekanlar · {count} kayıt')}
        </p>
      </header>

      {isPending ? <ListSkeleton count={3} /> : null}
      {isError ? <ErrorAlert error={mapError(error)} /> : null}

      {placeItems.length === 0 && !isPending && !isError ? (
        <EmptyState {...emptyStates.favorites} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {placeItems.map((i) => {
          const place = i.place!;
          const thumb = resolvePlaceImage(place.place_id, place.category, place.image_url, place.name);
          return (
            <article
              key={`${i.entity_type}:${i.entity_id}`}
              className="overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
            >
              <Link to={`/places/${i.entity_id}`} className="group block">
                <div className="relative h-36 overflow-hidden bg-stone-200 dark:bg-zinc-800">
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {categoryLabels[place.category]}
                  </span>
                </div>
                <div className="space-y-1 p-4">
                  <p className="font-display text-lg font-extrabold text-stone-900 dark:text-stone-50">
                    {place.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {place.district ? `${place.district}, ` : ''}
                    {place.city}
                  </p>
                </div>
              </Link>
              <div className="border-t border-stone-900/8 px-4 py-3 dark:border-white/10">
                <button
                  type="button"
                  className="tap-scale inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 text-sm font-bold text-stone-800 hover:border-red-300 hover:bg-red-50 hover:text-red-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-stone-100 dark:hover:border-red-500/40 dark:hover:bg-red-950/30 dark:hover:text-red-200"
                  onClick={() => removeMut.mutate({ entity_type: i.entity_type, entity_id: i.entity_id })}
                  disabled={removeMut.isPending}
                >
                  <HeartOff className="h-4 w-4" aria-hidden="true" />
                  {t('favorites.remove', 'Favoriden çıkar')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
