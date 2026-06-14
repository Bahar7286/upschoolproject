import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { ListSkeleton } from '../components/loading/page-skeleton';
import { BackButton } from '../components/ui/back-button';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorAlert } from '../components/ui/error-alert';
import { EMPTY_STATES } from '../content/empty-states';
import { mapError } from '../lib/user-errors';
import { listFavorites, removeFavorite } from '../services/favorite-service';
import { useAuthStore } from '../stores/auth-store';
import { PLACE_CATEGORY_LABELS } from '../types/place';

export default function FavoritesPage(): ReactElement {
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

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="text-sm">Favorileri görmek için giriş yapmalısın.</p>
        <Link className="font-bold text-primary" to="/login">
          Giriş yap
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5" aria-labelledby="fav-title">
      <BackButton />
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="fav-title">
          Favoriler
        </h1>
        <p className="text-sm text-theme-muted">Kaydettiğin mekanlar</p>
      </header>

      {isPending ? <ListSkeleton count={3} /> : null}
      {isError ? <ErrorAlert error={mapError(error)} /> : null}

      {items.length === 0 && !isPending && !isError ? (
        <EmptyState {...EMPTY_STATES.favorites} />
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items
          .filter((i) => i.entity_type === 'place' && i.place)
          .map((i) => (
            <div key={`${i.entity_type}:${i.entity_id}`} className="theme-card rounded-2xl p-4">
              <Link to={`/places/${i.entity_id}`}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">
                  {PLACE_CATEGORY_LABELS[i.place!.category]}
                </p>
                <p className="mt-1 font-display text-lg font-extrabold text-theme">{i.place!.name}</p>
                <p className="mt-1 text-sm text-theme-muted">
                  {i.place!.district ? `${i.place!.district}, ` : ''}
                  {i.place!.city}
                </p>
              </Link>
              <button
                type="button"
                className="tap-scale mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-900/10 bg-white text-sm font-bold text-stone-800 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100"
                onClick={() => removeMut.mutate({ entity_type: i.entity_type, entity_id: i.entity_id })}
                disabled={removeMut.isPending}
              >
                <HeartOff className="h-4 w-4" aria-hidden="true" />
                Favoriden çıkar
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}

