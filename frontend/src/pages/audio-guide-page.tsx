import type { ReactElement } from 'react';

export default function AudioGuidePage(): ReactElement {
  return (
    <section className="page-section" aria-labelledby="audio-title">
      <header className="page-head">
        <h1 className="page-title" id="audio-title">
          Sesli rehberlik
        </h1>
        <p className="page-subtitle">
          TR / EN / DE TTS katmanı için oynatıcı yerleşimi. Gerçek ses dosyaları ve OpenRouter entegrasyonu sonraki sprintte.
        </p>
      </header>

      <div className="audio-panel">
        <div className="audio-panel__art" aria-hidden="true">
          <span className="audio-wave" />
          <span className="audio-wave audio-wave--delay" />
          <span className="audio-wave audio-wave--delay2" />
        </div>
        <div className="audio-panel__body">
          <h2 className="audio-track">Örnek durak: Ayasofya çevresi</h2>
          <p className="muted">Geofence ile yaklaşınca otomatik başlatma (hedef ~20 m).</p>
          <div className="audio-controls">
            <button className="button button--primary" type="button">
              Oynat
            </button>
            <button className="button button--secondary" type="button">
              Dil: TR
            </button>
            <button className="button button--ghost" type="button">
              İndir (offline)
            </button>
          </div>
          <label className="sr-only" htmlFor="seek">
            İlerleme
          </label>
          <input id="seek" className="audio-seek" type="range" min={0} max={100} defaultValue={0} disabled />
        </div>
      </div>
    </section>
  );
}
