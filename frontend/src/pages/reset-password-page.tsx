import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

import { BrandLogo } from '../components/brand/brand-logo';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { resetPasswordWithToken } from '../services/auth-service';

export default function ResetPasswordPage(): ReactElement {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t('authReset.mismatch', 'Şifreler eşleşmiyor.'));
      return;
    }
    if (!token) {
      setError(t('authReset.invalidLink', 'Geçersiz bağlantı. Yeniden şifre sıfırlama isteyin.'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resetPasswordWithToken(token, password);
      navigate('/login', { replace: true, state: { message: t('authReset.updated', 'Şifreniz güncellendi.') } });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-md">
        <BrandLogo to="/" size="md" />
        <section className="theme-card mt-8 rounded-[22px] p-6">
          <h1 className="font-display text-2xl font-extrabold text-theme">{t('authReset.title', 'Yeni şifre')}</h1>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              className="theme-input min-h-[48px] rounded-xl px-4"
              type="password"
              placeholder={t('authReset.passwordPlaceholder', 'Yeni şifre (min. 6)')}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="theme-input min-h-[48px] rounded-xl px-4"
              type="password"
              placeholder={t('authReset.confirmPlaceholder', 'Yeni şifre tekrar')}
              minLength={6}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error ? (
              <p className="alert-error rounded-xl px-3 py-2 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="tap-scale flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white"
              type="submit"
              disabled={busy}
            >
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              {busy ? t('authReset.saving', 'Kaydediliyor…') : t('authReset.submit', 'Şifreyi güncelle')}
            </button>
          </form>
          <Link className="mt-4 inline-block text-sm font-semibold text-primary" to="/sifremi-unuttum">
            {t('authReset.newLink', 'Yeni bağlantı iste')}
          </Link>
        </section>
      </div>
    </div>
  );
}
