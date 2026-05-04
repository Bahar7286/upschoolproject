import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { listPurchases } from '../services/purchase-service';
import type { PurchaseResponse } from '../types/purchase';

export default function PurchasesPage(): ReactElement {
  const [items, setItems] = useState<PurchaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listPurchases();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Liste alınamadı.');
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
  }, []);

  return (
    <section className="page-section" aria-labelledby="pur-title">
      <header className="page-head">
        <h1 className="page-title" id="pur-title">
          Satın alımlar
        </h1>
        <p className="page-subtitle">İndirilebilir rota paketleri ve ödeme durumu (MVP backend).</p>
      </header>

      {error ? (
        <p className="banner banner--error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="skeleton-list" aria-busy="true" aria-label="Yükleniyor">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ) : (
        <ul className="data-list">
          {items.map((p) => (
            <li className="data-row" key={p.purchase_id}>
              <div>
                <p className="data-row__title">Satın alım #{p.purchase_id}</p>
                <p className="data-row__meta">
                  Rota #{p.route_id} · Kullanıcı #{p.user_id}
                </p>
              </div>
              <div className="data-row__end">
                <span className={`status status--${p.status}`}>{p.status}</span>
                <span className="data-row__amount">
                  {p.amount.toFixed(2)} {p.currency}
                </span>
                <Link className="button button--ghost" to={`/routes/${p.route_id}`}>
                  Aç
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 ? <p className="muted">Henüz satın alım yok.</p> : null}
    </section>
  );
}
