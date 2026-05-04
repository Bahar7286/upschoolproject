import type { ReactElement } from 'react';

import { useAuthStore } from '../stores/auth-store';

export default function ProfilePage(): ReactElement {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="page-section" aria-labelledby="prof-title">
      <header className="page-head">
        <h1 className="page-title" id="prof-title">
          Profil
        </h1>
        <p className="page-subtitle">Kültür puanları, rozetler ve skor tahtası için yer tutucu (MVP zenginleştirme sprinti).</p>
      </header>

      <div className="profile-grid">
        <div className="profile-card profile-card--hero">
          <div className="profile-avatar" aria-hidden="true">
            {user?.full_name?.slice(0, 1).toUpperCase() ?? 'H'}
          </div>
          <div>
            <h2 className="profile-name">{user?.full_name ?? 'Gezgin'}</h2>
            <p className="muted">{user?.email}</p>
            <span className="badge badge--soft">Rol: {user?.role ?? '—'}</span>
          </div>
        </div>

        <div className="stat-grid" aria-label="Oyunlaştırma istatistikleri">
          <div className="stat-tile">
            <p className="stat-tile__label">Kültür puanı</p>
            <p className="stat-tile__value">—</p>
            <p className="stat-tile__hint">Rota tamamlama ile artacak</p>
          </div>
          <div className="stat-tile">
            <p className="stat-tile__label">Rozetler</p>
            <p className="stat-tile__value">0</p>
            <p className="stat-tile__hint">Tarih meraklısı, şehir üstadı…</p>
          </div>
          <div className="stat-tile">
            <p className="stat-tile__label">Haftalık sıra</p>
            <p className="stat-tile__value">—</p>
            <p className="stat-tile__hint">Liderlik tablosu bağlanınca</p>
          </div>
        </div>

        <section className="panel panel--glass" aria-labelledby="trust-title">
          <h2 className="section-title" id="trust-title">
            Güven ve şeffaflık
          </h2>
          <p className="panel__text">
            PRD: onaylı rehber rozetleri ve şeffaf yorumlar. Bu web MVP’sinde gösterim katmanı hazır; veri API’si sonraki
            sprintte bağlanır.
          </p>
        </section>
      </div>
    </section>
  );
}
