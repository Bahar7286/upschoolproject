import type { ReactElement } from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ThemeToggle } from '../components/theme/theme-toggle';

export default function LandingPage(): ReactElement {
  return (
    <div className="landing heritage-bg transition-colors duration-300 dark:bg-zinc-950">
      <div className="landing__fog" aria-hidden="true" />
      <header className="landing__top">
        <div className="landing__logo">
          <span className="app-brand__mark" aria-hidden="true" />
          <span className="landing__logo-text dark:text-stone-100">Historial-GO</span>
        </div>
        <div className="landing__top-actions flex flex-wrap items-center justify-end gap-3">
          <ThemeToggle />
          <Link className="button button--secondary tap-scale dark:border-white/20 dark:bg-zinc-900 dark:text-stone-100" to="/login">
            Giriş
          </Link>
          <Link className="button button--primary tap-scale" to="/register">
            Kayıt ol
          </Link>
        </div>
      </header>

      <section className="landing__hero relative overflow-hidden">
        <p className="landing__eyebrow inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" strokeWidth={2} />
          İstanbul · deneyim ekonomisi · B2B2C · AI kişiselleştirme
        </p>
        <h1 className="landing__title">Şehri kendi hikayenle keşfet</h1>
        <p className="landing__lead">
          İlgi alanlarına, süreye ve bütçene göre yapay zekâ destekli rota önerileri; harita üzerinde duraklar, çok dilli
          sesli rehberlik ve oyunlaştırılmış kültür puanları—tek bir uygulamada.
        </p>
        <div className="landing__cta">
          <Link className="button button--primary button--lg" to="/register">
            Hemen başla
          </Link>
          <Link className="button button--secondary button--lg" to="/discover">
            Rotalara göz at
          </Link>
        </div>
        <ul className="landing__trust" aria-label="Güven ve değer">
          <li>Onaylı rehber içerikleri</li>
          <li>%15 platform · %85 rehber payı</li>
          <li>20 m yaklaşımda ses tetikleme (MVP hedefi)</li>
        </ul>
      </section>

      <section className="landing__grid" aria-labelledby="mvp-blocks">
        <h2 className="visually-hidden" id="mvp-blocks">
          MVP modülleri
        </h2>
        <article className="feature-card">
          <h3 className="feature-card__title">Akıllı onboarding</h3>
          <p className="feature-card__text">Tarih, sanat, gastronomi—ilgi alanlarını seç; profilini saniyeler içinde oluştur.</p>
        </article>
        <article className="feature-card">
          <h3 className="feature-card__title">AI rota sihirbazı</h3>
          <p className="feature-card__text">Süre, bütçe ve etiketlere göre en uygun rotaları öne çıkarırız.</p>
        </article>
        <article className="feature-card">
          <h3 className="feature-card__title">İnteraktif harita</h3>
          <p className="feature-card__text">Duraklar, navigasyon ve keşif odaklı tam ekran harita deneyimi.</p>
        </article>
        <article className="feature-card">
          <h3 className="feature-card__title">Sesli rehberlik</h3>
          <p className="feature-card__text">TR / EN / DE anlatımlar; lokasyonda otomatik tetikleme için altyapı.</p>
        </article>
        <article className="feature-card">
          <h3 className="feature-card__title">Oyunlaştırma</h3>
          <p className="feature-card__text">Kültür puanları, rozetler ve haftalık skor tahtası yer tutucuları.</p>
        </article>
        <article className="feature-card">
          <h3 className="feature-card__title">Rehber paneli</h3>
          <p className="feature-card__text">Rota oluşturma, gelir takibi ve ödeme talebi akışları.</p>
        </article>
      </section>

      <footer className="landing__footer">
        <p>Historial-GO — turizmde deneyim ekonomisi için MVP web arayüzü.</p>
      </footer>
    </div>
  );
}
