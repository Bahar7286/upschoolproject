import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { ArrowLeft, Compass, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { BrandLogo } from '../components/brand/brand-logo';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { LoadingButton } from '../components/ui/loading-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { formatApiError } from '../lib/api';
import {
  inputErrorClass,
  validateEmail,
  validatePassword,
  validateRequired,
  type FieldErrors,
} from '../lib/validation';
import { THEME_META } from '../lib/theme-meta';
import { useI18n } from '../lib/i18n';
import { fetchCurrentUser, registerUser } from '../services/auth-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import type { ThemePreference } from '../stores/theme-store';
import { THEME_LABELS, useThemeStore } from '../stores/theme-store';

const ROLES = [
  {
    id: 'tourist' as const,
    labelKey: 'auth.roleTourist',
    descKey: 'auth.roleTouristDesc',
    icon: '🗺️',
  },
  {
    id: 'guide' as const,
    labelKey: 'auth.roleGuide',
    descKey: 'auth.roleGuideDesc',
    icon: '🧭',
  },
] as const;

type Role = 'tourist' | 'guide' | 'admin';

export default function RegisterPage(): ReactElement {
  const { t } = useI18n();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('tourist');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { run, loading } = useSubmitLock();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const errs: FieldErrors = {};
    const nameErr = validateRequired(fullName, t('auth.fullName', 'Ad soyad'));
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (nameErr) errs.fullName = nameErr;
    if (emailErr) errs.email = emailErr;
    if (passErr) errs.password = passErr;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await run(async () => {
      try {
        const res = await registerUser({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role,
        });
        const me = await fetchCurrentUser(res.access_token);
        setSession(res.access_token, me);
        useOnboardingStore.getState().hydrateFromUser(me);
        if (role === 'guide') {
          navigate('/guide/dogrulama', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        setError(formatApiError(err));
      }
    });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-[#f4f0e8] via-[#ebe4d8] to-[#e2dbd2] px-4 py-8 text-stone-900 transition-colors duration-300 dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(900px 520px at 20% -10%, rgb(201 162 39 / 20%), transparent 55%), radial-gradient(700px 420px at 85% 90%, rgb(29 185 84 / 14%), transparent 50%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <BrandLogo to="/" size="md" />
          <ThemeToggle />
        </header>

        <section
          className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 shadow-lift backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-lift-dark"
          aria-labelledby="register-heading"
        >
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 dark:bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary-dark dark:text-primary" aria-hidden="true" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary dark:text-primary">
                {t('auth.registerBadge', 'Yeni hesap')}
              </p>
              <h1
                className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50"
                id="register-heading"
              >
                {t('auth.registerTitle', 'Kayıt ol')}
              </h1>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {t('auth.registerSubtitle', 'İstanbul rotalarını keşfetmeye bir adım kaldı.')}
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-800 dark:text-stone-200" htmlFor="reg-name">
                {t('auth.fullName', 'Ad soyad')}
              </label>
              <input
                id="reg-name"
                className={`focus-ring tap-scale min-h-[48px] w-full rounded-xl border border-stone-900/15 bg-white px-4 text-[15px] text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-primary dark:border-white/15 dark:bg-zinc-950 dark:text-stone-50 dark:placeholder:text-stone-500 ${fieldErrors.fullName ? inputErrorClass : ''}`}
                autoComplete="name"
                placeholder={t('auth.fullNamePlaceholder', 'Adınız Soyadınız')}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((f) => ({ ...f, fullName: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.fullName)}
              />
              {fieldErrors.fullName ? (
                <p className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                  {fieldErrors.fullName}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-800 dark:text-stone-200" htmlFor="reg-email">
                {t('auth.email', 'E-posta')}
              </label>
              <input
                id="reg-email"
                className={`focus-ring tap-scale min-h-[48px] w-full rounded-xl border border-stone-900/15 bg-white px-4 text-[15px] text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-primary dark:border-white/15 dark:bg-zinc-950 dark:text-stone-50 dark:placeholder:text-stone-500 ${fieldErrors.email ? inputErrorClass : ''}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? (
                <p className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-800 dark:text-stone-200" htmlFor="reg-password">
                {t('auth.password', 'Şifre')}
                <span className="ml-1.5 text-xs font-normal text-stone-500 dark:text-stone-400">{t('auth.passwordHint', '(en az 6 karakter)')}</span>
              </label>
              <input
                id="reg-password"
                className={`focus-ring tap-scale min-h-[48px] w-full rounded-xl border border-stone-900/15 bg-white px-4 text-[15px] text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-primary dark:border-white/15 dark:bg-zinc-950 dark:text-stone-50 dark:placeholder:text-stone-500 ${fieldErrors.password ? inputErrorClass : ''}`}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password ? (
                <p className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {t('auth.accountType', 'Hesap türü')}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <label
                    key={r.id}
                    className={`tap-scale focus-ring relative flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3 transition-colors ${
                      role === r.id
                        ? 'border-primary bg-primary/8 dark:bg-primary/10'
                        : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-950'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={role === r.id}
                      onChange={() => setRole(r.id)}
                      className="sr-only"
                    />
                    <span className="text-xl" aria-hidden="true">{r.icon}</span>
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-50">{t(r.labelKey, r.id === 'tourist' ? 'Turist' : 'Rehber')}</span>
                    <span className="text-[11px] leading-snug text-stone-500 dark:text-stone-400">{t(r.descKey, '')}</span>
                    {role === r.id && (
                      <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <Compass className="h-2.5 w-2.5 text-white" aria-hidden="true" strokeWidth={3} />
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {t('auth.appearance', 'Görünüm')}
                <span className="ml-1.5 text-xs font-normal text-stone-500 dark:text-stone-400">{t('auth.appearanceHint', '(sonra değiştirebilirsin)')}</span>
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {THEME_META.map((t) => {
                  const id = t.id as ThemePreference;
                  const active = themePreference === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`tap-scale focus-ring rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                        active
                          ? 'border-primary bg-primary/8 dark:bg-primary/10'
                          : 'border-stone-900/10 bg-white dark:border-white/10 dark:bg-zinc-950'
                      }`}
                      onClick={() => setThemePreference(id)}
                    >
                      <span className="block text-stone-900 dark:text-stone-50">{THEME_LABELS[id]}</span>
                      <span className="mt-0.5 block text-[11px] font-normal leading-snug text-stone-500 dark:text-stone-400">
                        {t.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {error ? (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <LoadingButton className="w-full" type="submit" loading={loading} loadingLabel={t('auth.creatingAccount', 'Hesap oluşturuluyor…')}>
              {t('auth.createAccount', 'Hesap oluştur')}
            </LoadingButton>
          </form>

          <div className="mt-6 space-y-3 border-t border-stone-900/10 pt-5 text-center text-sm text-stone-600 dark:border-white/10 dark:text-stone-400">
            <p>
              {t('auth.hasAccount', 'Zaten hesabın var mı?')}{' '}
              <Link
                className="font-bold text-heritage-ink underline-offset-4 hover:underline dark:text-amber-200"
                to="/login"
              >
                {t('auth.loginTitle', 'Giriş yap')}
              </Link>
            </p>
            <Link
              className="tap-scale inline-flex items-center justify-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300"
              to="/"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
              {t('common.home', 'Ana sayfa')}
            </Link>
          </div>
        </section>

        <p className="text-center text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
          {t('auth.registerLegal', 'Kayıt olarak')}{' '}
          <a href="/terms" className="underline underline-offset-2">{t('auth.termsLink', 'Kullanım Koşulları')}</a>,{' '}
          <a href="/privacy" className="underline underline-offset-2">{t('auth.privacyLink', 'Gizlilik')}</a>,{' '}
          <a href="/kvkk" className="underline underline-offset-2">{t('auth.kvkkLink', 'KVKK aydınlatma')}</a>.
        </p>
      </div>
    </div>
  );
}
