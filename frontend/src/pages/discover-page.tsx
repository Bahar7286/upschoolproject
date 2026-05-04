import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useRoutesQuery } from '../hooks/use-routes-query';
import { recommendRoutes } from '../services/route-service';
import { useOnboardingStore } from '../stores/onboarding-store';

export default function DiscoverPage(): ReactElement {
  const { data: routes = [], isPending, isError, error } = useRoutesQuery();

  const interests = useOnboardingStore((s) => s.interests);
  const durationMinutes = useOnboardingStore((s) => s.durationMinutes);
  const budget = useOnboardingStore((s) => s.budget);

  const recommendMutation = useMutation({
    mutationFn: () =>
      recommendRoutes({
        interests: interests.length ? interests : ['history', 'art'],
        duration_minutes: durationMinutes,
        budget,
      }),
  });

  const recommended = recommendMutation.data ?? null;
  const display = recommended ?? routes;

  const queryError = isError && error instanceof Error ? error.message : '';
  const mutationError =
    recommendMutation.isError && recommendMutation.error instanceof Error
      ? recommendMutation.error.message
      : '';
  const bannerError = queryError || mutationError;

  return (
    <section className="page-section" aria-labelledby="disc-title">
      <header className="page-head">
        <h1 className="page-title" id="disc-title">
          Rota keşfi
        </h1>
        <p className="page-subtitle">
          Kişiselleştirilmiş öneriler için önce ilgi alanlarını kaydet; ardından AI ile en uygun rotaları çek (TanStack Query).
        </p>
      </header>

      <div className="panel panel--glass">
        <div className="panel__row">
          <div>
            <p className="panel__eyebrow">AI önerisi</p>
            <p className="panel__text">
              İlgi: {interests.length ? interests.join(', ') : '(varsayılan)'} · Süre {durationMinutes} dk · Bütçe ₺
              {budget}
            </p>
          </div>
          <button
            className="button button--primary"
            type="button"
            disabled={recommendMutation.isPending}
            onClick={() => recommendMutation.mutate()}
          >
            {recommendMutation.isPending ? 'Hesaplanıyor…' : 'AI ile öner'}
          </button>
        </div>
        {recommended ? (
          <button className="button button--ghost" type="button" onClick={() => recommendMutation.reset()}>
            Tüm rotaları göster
          </button>
        ) : null}
      </div>

      {bannerError ? (
        <p className="banner banner--error" role="alert">
          {bannerError}
        </p>
      ) : null}

      {isPending ? (
        <div className="skeleton-grid" aria-busy="true" aria-label="Yükleniyor">
          {[1, 2, 3].map((k) => (
            <div key={k} className="skeleton-card" />
          ))}
        </div>
      ) : isError ? (
        <p className="muted">Liste yüklenemedi; API adresini kontrol edin.</p>
      ) : (
        <div className="route-list__grid route-list__grid--fluid">
          {display.map((route) => (
            <article className="route-card route-card--heritage" key={route.route_id}>
              <div className="route-card__hero">
                <span className="route-card__hero-gradient" aria-hidden="true" />
                <div className="route-card__hero-top">
                  <span className="category-tag">{route.city}</span>
                  {route.tags.slice(0, 1).map((t) => (
                    <span key={t} className="badge badge--gold">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="route-card__title">{route.title}</h2>
              </div>
              <div className="route-card__content">
                <p className="route-card__meta">
                  {route.estimated_minutes} dk · ₺{route.price.toFixed(2)} · Rehber #{route.guide_id}
                </p>
                <div className="tag-row">
                  {route.tags.map((tag) => (
                    <span key={tag} className="pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link className="button button--secondary button--block" to={`/routes/${route.route_id}`}>
                  Detay ve duraklar
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
