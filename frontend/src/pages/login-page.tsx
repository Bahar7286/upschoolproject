import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { ArrowLeft, Lock, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { BrandLogo } from '../components/brand/brand-logo';
import { PageMeta } from '../components/seo/page-meta';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { LoadingButton } from '../components/ui/loading-button';
import { useSubmitLock } from '../hooks/use-submit-lock';
import { formatApiError } from '../lib/api';
import { inputErrorClass, validateEmail, validatePassword, type FieldErrors } from '../lib/validation';
import { fetchCurrentUser, loginUser } from '../services/auth-service';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';

export default function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { run, loading } = useSubmitLock();

  const redirectTarget = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const errs: FieldErrors = {};
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr) errs.email = emailErr;
    if (passErr) errs.password = passErr;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await run(async () => {
      try {
        const tokens = await loginUser({ email: email.trim(), password });
        const me = await fetchCurrentUser(tokens.access_token);
        setSession(tokens.access_token, me);
        useOnboardingStore.getState().hydrateFromUser(me);
        let fallback = '/discover';
        if (me.role === 'admin') fallback = '/admin';
        else if (me.role === 'guide') fallback = '/guide';
        else if (!me.onboarding_completed) fallback = '/onboarding';
        navigate(redirectTarget && redirectTarget !== '/login' ? redirectTarget : fallback, {
          replace: true,
        });
      } catch (err) {
        setError(formatApiError(err));
      }
    });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-[#f4f0e8] via-[#ebe4d8] to-[#e2dbd2] px-4 py-8 text-stone-900 transition-colors duration-300 dark:from-zinc-950 dark:via-zinc-950 dark:to-black dark:text-stone-100">
      <PageMeta title="Giriş" description="Historial GO hesabınıza giriş yapın." path="/login" noindex />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(900px 520px at 80% -10%, rgb(201 162 39 / 22%), transparent 55%), radial-gradient(700px 420px at 10% 90%, rgb(29 185 84 / 12%), transparent 50%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <BrandLogo to="/" size="md" />
          <ThemeToggle />
        </header>

        <section
          className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 shadow-lift backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-lift-dark"
          aria-labelledby="login-heading"
        >
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 dark:bg-amber-400/15">
              <LogIn className="h-6 w-6 text-amber-800 dark:text-amber-300" aria-hidden="true" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary dark:text-primary">
                Güvenli oturum
              </p>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="login-heading">
                Giriş yap
              </h1>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                AI rotaları, harita ve sesli rehber için hesabınla devam et.
              </p>
            </div>
          </div>

          {redirectTarget ? (
            <div
              className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
              role="status"
            >
              Devam etmek için önce giriş yapın. Girişten sonra istenen sayfaya yönlendirilirsiniz.
            </div>
          ) : null}

          <div className="mb-5 rounded-xl border border-stone-900/10 bg-stone-50/90 px-3 py-2.5 text-xs leading-snug text-stone-700 dark:border-white/10 dark:bg-zinc-950/80 dark:text-stone-300">
            <span className="mr-1 inline-flex h-5 w-5 align-middle text-stone-500 dark:text-stone-400">
              <Lock className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
            </span>
            <strong className="font-semibold text-stone-800 dark:text-stone-200">Demo:</strong>{' '}
            <code className="rounded bg-white/80 px-1 font-mono text-[11px] dark:bg-zinc-900">tourist@example.com</code> · şifre{' '}
            <code className="rounded bg-white/80 px-1 font-mono text-[11px] dark:bg-zinc-900">demo123</code> (backend seed)
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-stone-800 dark:text-stone-200" htmlFor="login-email">
                E-posta
              </label>
              <input
                id="login-email"
                className={`focus-ring tap-scale min-h-[48px] w-full rounded-xl border border-stone-900/15 bg-white px-4 text-[15px] text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-primary dark:border-white/15 dark:bg-zinc-950 dark:text-stone-50 dark:placeholder:text-stone-500 ${fieldErrors.email ? inputErrorClass : ''}`}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
              />
              {fieldErrors.email ? (
                <p id="login-email-err" className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-stone-800 dark:text-stone-200" htmlFor="login-password">
                  Şifre
                </label>
                <Link
                  className="text-xs font-bold text-primary hover:underline"
                  to="/sifremi-unuttum"
                >
                  Şifremi unuttum
                </Link>
              </div>
              <input
                id="login-password"
                className={`focus-ring tap-scale min-h-[48px] w-full rounded-xl border border-stone-900/15 bg-white px-4 text-[15px] text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-primary dark:border-white/15 dark:bg-zinc-950 dark:text-stone-50 dark:placeholder:text-stone-500 ${fieldErrors.password ? inputErrorClass : ''}`}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-pass-err' : undefined}
              />
              {fieldErrors.password ? (
                <p id="login-pass-err" className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {error ? (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <LoadingButton className="w-full" type="submit" loading={loading} loadingLabel="Giriş yapılıyor…">
              Devam et
            </LoadingButton>
          </form>

          <div className="mt-6 space-y-3 border-t border-stone-900/10 pt-5 text-center text-sm text-stone-600 dark:border-white/10 dark:text-stone-400">
            <p>
              Hesabın yok mu?{' '}
              <Link className="font-bold text-heritage-ink underline-offset-4 hover:underline dark:text-amber-200" to="/register">
                Kayıt ol
              </Link>
            </p>
            <Link
              className="tap-scale inline-flex items-center justify-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300"
              to="/"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
              Ana sayfa
            </Link>
          </div>
        </section>

        <p className="text-center text-[11px] leading-relaxed text-stone-500 dark:text-stone-500">
          Oturum açınca JWT saklanır; çıkış yapana kadar cihazınızda tutulur. Üretimde HTTPS ve güçlü şifre politikası kullanın.
        </p>
      </div>
    </div>
  );
}
