import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getGuideEarnings } from '../services/guide-service';
import { useAuthStore } from '../stores/auth-store';

export default function GuideDashboardPage(): ReactElement {
  const user = useAuthStore((s) => s.user);
  const [earnings, setEarnings] = useState<{ monthly_earnings: number; route_sales: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'guide') {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getGuideEarnings(user.user_id);
        if (!cancelled) {
          setEarnings({ monthly_earnings: data.monthly_earnings, route_sales: data.route_sales });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Veri alınamadı.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.user_id]);

  if (user?.role !== 'guide') {
    return (
      <section className="page-section">
        <header className="page-head">
          <h1 className="page-title">Rehber paneli</h1>
          <p className="page-subtitle">Bu alan yalnızca rehber rolü için. Turist hesabıyla içerik üretimi yapılamaz.</p>
        </header>
        <div className="panel panel--glass">
          <p className="panel__text">Rehber olarak kayıt ol veya hesabını güncelle.</p>
          <Link className="button button--primary" to="/register">
            Rehber kaydı
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section" aria-labelledby="gd-title">
      <header className="page-head">
        <h1 className="page-title" id="gd-title">
          Gelir paneli
        </h1>
        <p className="page-subtitle">Komisyon modeli: %15 platform · %85 rehber. Ödeme talebi akışı backend üzerinden.</p>
      </header>

      {error ? (
        <p className="banner banner--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dashboard-grid">
        <div className="dash-card">
          <p className="dash-card__label">Bu ay net</p>
          <p className="dash-card__value">₺{earnings ? earnings.monthly_earnings.toFixed(2) : '—'}</p>
          <p className="dash-card__hint">Demo API: `/guides/{user.user_id}/earnings`</p>
        </div>
        <div className="dash-card">
          <p className="dash-card__label">Satış adedi</p>
          <p className="dash-card__value">{earnings ? earnings.route_sales : '—'}</p>
          <p className="dash-card__hint">Performans analitiği yakında</p>
        </div>
        <div className="dash-card dash-card--wide">
          <p className="dash-card__label">Sonraki adım</p>
          <p className="panel__text">
            Harita üzerinde durak seçerek rota oluşturma arayüzü burada birleştirilecek. Şimdilik rotaları API üzerinden veya
            keşif ekranından takip edin.
          </p>
          <div className="page-actions">
            <Link className="button button--primary" to="/discover">
              Rotaları gör
            </Link>
            <button className="button button--secondary" type="button">
              Ödeme talebi (yakında)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
