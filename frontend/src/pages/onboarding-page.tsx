import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Landmark, Monitor, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { formatApiError } from '../lib/api';
import { THEME_META } from '../lib/theme-meta';
import { updatePreferences } from '../services/profile-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import type { ThemePreference } from '../stores/theme-store';
import { THEME_LABELS } from '../stores/theme-store';
import { useThemeStore } from '../stores/theme-store';

const INTERESTS = [
  { id: 'history', label: 'Tarih', icon: '🏛' },
  { id: 'art', label: 'Sanat', icon: '🎨' },
  { id: 'architecture', label: 'Mimari', icon: '🏗' },
  { id: 'gastronomy', label: 'Gastronomi', icon: '🍽' },
  { id: 'hidden', label: 'Gizli Köşeler', icon: '🔍' },
  { id: 'religious', label: 'Dini', icon: '🕌' },
  { id: 'modern', label: 'Modern', icon: '⚡' },
];

const DURATIONS = [
  { value: 60, label: '1 sa' },
  { value: 120, label: '2 sa' },
  { value: 240, label: 'Yarım gün' },
  { value: 480, label: 'Tam gün' },
];

const BUDGETS = [
  { value: 0, label: 'Ücretsiz' },
  { value: 75, label: '₺50–100' },
  { value: 150, label: '₺100+' },
];

function iconForTheme(id: ThemePreference): typeof Sun {
  if (id === 'light') return Sun;
  if (id === 'dark') return Moon;
  if (id === 'system') return Monitor;
  return Landmark;
}

const THEMES: { id: ThemePreference; label: string; desc: string; Icon: typeof Sun }[] = THEME_META.map((t) => ({
  id: t.id,
  label: THEME_LABELS[t.id],
  desc: `${t.tagline} · ${t.mood}`,
  Icon: iconForTheme(t.id),
}));

export default function OnboardingPage(): ReactElement {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const interests = useOnboardingStore((s) => s.interests);
  const durationMinutes = useOnboardingStore((s) => s.durationMinutes);
  const budget = useOnboardingStore((s) => s.budget);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const setInterests = useOnboardingStore((s) => s.setInterests);
  const setDurationMinutes = useOnboardingStore((s) => s.setDurationMinutes);
  const setBudget = useOnboardingStore((s) => s.setBudget);
  const setPreferredLanguage = useOnboardingStore((s) => s.setPreferredLanguage);

  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((x) => x !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const finish = async (event?: FormEvent) => {
    event?.preventDefault();
    if (interests.length < 2) {
      setError('En az 2 ilgi alanı seçmelisiniz.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (accessToken) {
        const updated = await updatePreferences(accessToken, {
          interests,
          duration_minutes: durationMinutes,
          budget,
          theme_preference: themePreference,
          preferred_language: preferredLanguage,
          onboarding_completed: true,
        });
        setUser(updated);
      }
      navigate('/discover', { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <section className="mx-auto max-w-lg space-y-6 px-1 py-4" aria-labelledby="onb-title">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold text-stone-600 dark:text-stone-400">
          <button
            type="button"
            className="tap-scale inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-stone-900/5 dark:hover:bg-white/5"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step > 1 ? 'Geri' : 'Çık'}
          </button>
          <span>{step}/3</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="onb-title">
              Seni en çok ne ilgilendiriyor?
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">En az 2 seç · AI önerilerin buna göre şekillenir</p>
          </header>
          <div className="flex flex-wrap gap-2" role="group" aria-label="İlgi alanları">
            {INTERESTS.map((item) => {
              const active = interests.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`tap-scale rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'border-primary bg-primary/10 text-primary-dark dark:text-primary'
                      : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                  }`}
                  aria-pressed={active}
                  onClick={() => toggleInterest(item.id)}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-stone-500">Seçilen: {interests.length}</p>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-50"
            type="button"
            disabled={interests.length < 2}
            onClick={() => setStep(2)}
          >
            Devam <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-fade-in-up">
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
              Nasıl gezmek istersin?
            </h1>
          </header>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Süre</legend>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`tap-scale rounded-full px-4 py-2 text-sm font-semibold ${
                    durationMinutes === d.value
                      ? 'bg-primary text-white'
                      : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                  }`}
                  onClick={() => setDurationMinutes(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Bütçe</legend>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  className={`tap-scale rounded-full px-4 py-2 text-sm font-semibold ${
                    budget === b.value
                      ? 'bg-primary text-white'
                      : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                  }`}
                  onClick={() => setBudget(b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Tercih dili</legend>
            <div className="flex flex-wrap gap-2">
              {(['tr', 'en', 'de'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`tap-scale rounded-full px-4 py-2 text-sm font-semibold uppercase ${
                    preferredLanguage === lang
                      ? 'bg-primary text-white'
                      : 'border border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                  }`}
                  onClick={() => setPreferredLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark"
            type="button"
            onClick={() => setStep(3)}
          >
            Devam <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {step === 3 && (
        <form className="space-y-5 animate-fade-in-up" onSubmit={finish}>
          <header>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50">
              Görünümünü seç
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">İstediğinde profilden değiştirebilirsin</p>
          </header>
          <div className="space-y-3">
            {THEMES.map(({ id, label, desc, Icon }) => (
              <label
                key={id}
                className={`tap-scale flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${
                  themePreference === id
                    ? 'border-primary bg-primary/8'
                    : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={id}
                  checked={themePreference === id}
                  onChange={() => setThemePreference(id)}
                  className="sr-only"
                />
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <div>
                  <p className="font-bold">{label}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Kaydediliyor…' : 'Keşfe Başla!'}
          </button>
        </form>
      )}
    </section>
  );
}
