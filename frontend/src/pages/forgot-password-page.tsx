import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

import { BrandLogo } from '../components/brand/brand-logo';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { requestPasswordReset } from '../services/auth-service';

export default function ForgotPasswordPage(): ReactElement {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    setResetUrl(null);
    try {
      const res = await requestPasswordReset(email);
      setMessage(res.message);
      if (res.reset_url) setResetUrl(res.reset_url);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-gradient-to-b from-[#f4f0e8] via-[#ebe4d8] to-[#e2dbd2] px-4 py-8 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <BrandLogo to="/" size="md" />
          <ThemeToggle />
        </header>

        <section className="theme-card rounded-[22px] p-6">
          <h1 className="font-display text-2xl font-extrabold text-theme">{t('authForgot.title', 'Şifremi unuttum')}</h1>
          <p className="mt-2 text-sm text-theme-muted">
            {t('authForgot.hint', 'E-posta kayıtlıysa sıfırlama bağlantısı gönderilir.')}
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-theme" htmlFor="forgot-email">
              {t('authForgot.email', 'E-posta')}
            </label>
            <input
              id="forgot-email"
              className="theme-input min-h-[48px] w-full rounded-xl px-4"
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
            {error ? (
              <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="alert-success rounded-xl px-3 py-2 text-sm" role="status">
                {message}
              </p>
            ) : null}
            {resetUrl && import.meta.env.DEV ? (
              <p className="break-anywhere rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs">
                <strong>{t('authForgot.devLink', 'Geliştirici bağlantısı:')}</strong>{' '}
                <Link
                  className="font-bold text-primary underline"
                  to={(() => {
                    try {
                      const u = new URL(resetUrl);
                      return `${u.pathname}${u.search}`;
                    } catch {
                      return '/sifre-sifirla';
                    }
                  })()}
                >
                  {t('authForgot.resetLink', 'Şifreyi sıfırla')}
                </Link>
              </p>
            ) : null}
            <button
              className="tap-scale min-h-[48px] rounded-xl bg-primary font-bold text-white disabled:opacity-60"
              type="submit"
              disabled={busy}
            >
              <Mail className="mr-2 inline h-5 w-5" aria-hidden="true" />
              {busy ? t('authForgot.submitting', 'Gönderiliyor…') : t('authForgot.submit', 'Sıfırlama bağlantısı iste')}
            </button>
          </form>

          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-theme-muted" to="/login">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('authForgot.backLogin', 'Girişe dön')}
          </Link>
        </section>
      </div>
    </div>
  );
}
