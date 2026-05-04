import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { useOnboardingStore } from '../stores/onboarding-store';

const INTERESTS = [
  { id: 'history', label: 'Tarih' },
  { id: 'art', label: 'Sanat' },
  { id: 'gastronomy', label: 'Gastronomi' },
  { id: 'architecture', label: 'Mimari' },
  { id: 'nature', label: 'Doğa' },
];

export default function OnboardingPage(): ReactElement {
  const navigate = useNavigate();
  const interests = useOnboardingStore((s) => s.interests);
  const durationMinutes = useOnboardingStore((s) => s.durationMinutes);
  const budget = useOnboardingStore((s) => s.budget);
  const setInterests = useOnboardingStore((s) => s.setInterests);
  const setDurationMinutes = useOnboardingStore((s) => s.setDurationMinutes);
  const setBudget = useOnboardingStore((s) => s.setBudget);

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((x) => x !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  return (
    <section className="page-section" aria-labelledby="onb-title">
      <header className="page-head">
        <h1 className="page-title" id="onb-title">
          İlgi alanların
        </h1>
        <p className="page-subtitle">
          AI önerileri için birkaç seçim yap. PRD’deki “sadelik” ilkesi: en fazla birkaç dokunuşla profil.
        </p>
      </header>

      <div className="chip-grid" role="group" aria-label="İlgi alanları">
        {INTERESTS.map((item) => {
          const active = interests.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`chip${active ? ' chip--active' : ''}`}
              aria-pressed={active}
              onClick={() => toggleInterest(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="form-grid">
        <div className="field">
          <label className="field__label" htmlFor="duration">
            Süre (dakika)
          </label>
          <input
            id="duration"
            className="field__input"
            type="number"
            min={30}
            max={720}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="budget">
            Bütçe (₺)
          </label>
          <input
            id="budget"
            className="field__input"
            type="number"
            min={0}
            step={10}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="page-actions">
        <button className="button button--primary" type="button" onClick={() => navigate('/discover')}>
          Önerilere git
        </button>
        <button className="button button--secondary" type="button" onClick={() => navigate('/map')}>
          Haritayı aç
        </button>
      </div>
    </section>
  );
}
