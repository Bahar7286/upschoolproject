import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getRoute } from '../services/route-service';
import { listStops } from '../services/stop-service';
import type { RouteResponse } from '../types/route';
import type { StopResponse } from '../types/stop';

export default function RouteDetailPage(): ReactElement {
  const { routeId } = useParams();
  const id = Number(routeId);

  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [stops, setStops] = useState<StopResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Geçersiz rota.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [r, s] = await Promise.all([getRoute(id), listStops(id)]);
        if (!cancelled) {
          setRoute(r);
          setStops(s);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Rota yüklenemedi.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="page-section" aria-busy="true" aria-label="Rota yükleniyor">
        <div className="skeleton-hero" />
        <div className="skeleton-list">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </section>
    );
  }

  if (error || !route) {
    return (
      <section className="page-section">
        <p className="banner banner--error" role="alert">
          {error || 'Rota bulunamadı.'}
        </p>
        <Link className="button button--secondary" to="/discover">
          Keşfe dön
        </Link>
      </section>
    );
  }

  return (
    <section className="page-section">
      <nav className="breadcrumb" aria-label="Sayfa konumu">
        <Link to="/discover">Keşfet</Link>
        <span aria-hidden="true"> / </span>
        <span>{route.title}</span>
      </nav>

      <header className="detail-hero">
        <p className="detail-hero__eyebrow">{route.city}</p>
        <h1 className="detail-hero__title">{route.title}</h1>
        <p className="detail-hero__meta">
          {route.estimated_minutes} dakika · ₺{route.price.toFixed(2)} · Rehber #{route.guide_id}
        </p>
        <div className="detail-hero__actions">
          <button className="button button--primary" type="button">
            Satın al (Stripe — yakında)
          </button>
          <Link className="button button--secondary" to="/map">
            Haritada gör
          </Link>
        </div>
      </header>

      <section className="stops-section" aria-labelledby="stops-title">
        <h2 className="section-title" id="stops-title">
          Duraklar
        </h2>
        <ol className="stop-list">
          {stops.map((stop, index) => (
            <li className="stop-card" key={stop.stop_id}>
              <div className="stop-card__index" aria-hidden="true">
                {index + 1}
              </div>
              <div className="stop-card__body">
                <h3 className="stop-card__title">{stop.title}</h3>
                <p className="stop-card__desc">{stop.description || 'Anlatım metni bu durak için henüz eklenmedi.'}</p>
                <p className="stop-card__geo">
                  {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)} · sıra {stop.order_index}
                </p>
                <button className="button button--ghost" type="button">
                  TTS dinle (yakında)
                </button>
              </div>
            </li>
          ))}
        </ol>
        {stops.length === 0 ? <p className="muted">Bu rota için durak kaydı yok.</p> : null}
      </section>
    </section>
  );
}
