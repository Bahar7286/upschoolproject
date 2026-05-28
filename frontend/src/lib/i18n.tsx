import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import en from '../locales/en.json';
import tr from '../locales/tr.json';
import { updatePreferences } from '../services/profile-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';

export type AppLocale = 'tr' | 'en';

const dictionaries: Record<AppLocale, Record<string, unknown>> = { tr, en };

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }): ReactElement {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const storeLang = useOnboardingStore((s) => s.preferredLanguage);

  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (user?.preferred_language === 'en') return 'en';
    if (storeLang === 'en') return 'en';
    return 'tr';
  });

  useEffect(() => {
    const fromUser = user?.preferred_language;
    if (fromUser === 'en' || fromUser === 'tr') {
      setLocaleState(fromUser);
      useOnboardingStore.getState().setPreferredLanguage(fromUser);
    }
  }, [user?.preferred_language]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setLocaleState(next);
      useOnboardingStore.getState().setPreferredLanguage(next);
      if (!accessToken || !user) return;
      void updatePreferences(accessToken, {
        interests: user.interests,
        duration_minutes: user.duration_minutes,
        budget: user.budget,
        theme_preference: user.theme_preference,
        preferred_language: next,
        preferred_city: user.preferred_city ?? useOnboardingStore.getState().preferredCity,
        onboarding_completed: user.onboarding_completed,
      }).then(setUser);
    },
    [accessToken, setUser, user],
  );

  const t = useCallback(
    (key: string, fallback?: string) => {
      return getNested(dictionaries[locale], key) ?? fallback ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function LanguageSwitcher(): ReactElement {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex gap-2" role="group" aria-label="Dil seçimi">
      {(['tr', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          className={`tap-scale min-h-[44px] rounded-full px-4 py-2 text-sm font-bold uppercase ${
            locale === lang ? 'bg-primary text-white' : 'border border-stone-900/10 dark:border-white/10'
          }`}
          aria-pressed={locale === lang}
          onClick={() => setLocale(lang)}
        >
          {lang === 'tr' ? 'Türkçe' : 'English'}
        </button>
      ))}
    </div>
  );
}
