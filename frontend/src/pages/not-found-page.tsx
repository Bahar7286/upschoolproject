import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage(): ReactElement {
  return (
    <div className="auth-page heritage-bg">
      <div className="auth-card auth-card--elevated">
        <h1 className="auth-card__title">Sayfa bulunamadı</h1>
        <p className="auth-card__description">Aradığın rota başka bir sokakta olabilir.</p>
        <div className="page-actions">
          <Link className="button button--primary" to="/discover">
            Keşfe dön
          </Link>
          <Link className="button button--secondary" to="/">
            Ana sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
