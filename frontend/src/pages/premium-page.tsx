import { Crown, Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatApiError } from '../lib/api';
import {
  fetchPremiumRequestStatus,
  submitPremiumRequest,
} from '../services/premium-service';
import { fetchCurrentUser } from '../services/auth-service';
import { useAuthStore } from '../stores/auth-store';

export default function PremiumPage(): ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [pending, setPending] = useState(false);
  const [isPremium, setIsPremium] = useState(user?.is_premium ?? false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void fetchPremiumRequestStatus(accessToken)
      .then((s) => {
        setPending(s.has_pending);
        setIsPremium(s.is_premium);
      })
      .catch(() => {
        /* sessiz */
      });
  }, [accessToken]);

  const handleRequest = async () => {
    if (!accessToken) {
      setError('Talep göndermek için giriş yapmalısınız.');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await submitPremiumRequest(accessToken, 'Premium erişim talebi');
      setPending(true);
      setMsg('Talebiniz alındı. Admin onayından sonra Premium açılacak.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!accessToken) return;
    try {
      const me = await fetchCurrentUser(accessToken);
      setUser(me);
      setIsPremium(me.is_premium ?? false);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-5 text-center" aria-labelledby="prem-title">
      <header className="space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Crown className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme" id="prem-title">
          Premium’a Geç
        </h1>
        <p className="text-sm text-theme-muted">
          Ödeme entegrasyonu yok — <strong>Talep Et</strong> ile admin onayı alın.
        </p>
      </header>

      <div className="theme-card space-y-3 rounded-2xl p-6 text-left">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-primary-dark dark:text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Premium ile açılanlar
        </p>
        <ul className="list-inside list-disc space-y-2 text-sm text-theme-muted">
          <li>Sınırsız AI öneri (ilgi alanına göre rota/plan).</li>
          <li>Daha zengin keşif filtreleri ve hızlı öneriler.</li>
          <li>Offline paket ve gelişmiş özellikler (yakında).</li>
        </ul>
      </div>

      {isPremium ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Premium hesabınız aktif.
        </p>
      ) : pending ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Talebiniz admin incelemesinde. Onaylandığında burada görünecek.
          <button type="button" className="ml-2 underline" onClick={() => void refreshUser()}>
            Durumu yenile
          </button>
        </p>
      ) : (
        <button
          type="button"
          disabled={loading}
          className="tap-scale mx-auto inline-flex min-h-[52px] w-full max-w-sm items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white disabled:opacity-60"
          onClick={() => void handleRequest()}
        >
          {loading ? 'Gönderiliyor…' : 'Talep Et'}
        </button>
      )}

      {msg ? <p className="text-sm font-semibold text-primary">{msg}</p> : null}
      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          className="tap-scale inline-flex min-h-[48px] items-center justify-center rounded-xl border border-stone-900/10 bg-white px-6 font-bold text-stone-900 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100"
          to="/profile"
        >
          Profile dön
        </Link>
        <Link
          className="tap-scale inline-flex min-h-[48px] items-center justify-center rounded-xl border border-stone-900/10 bg-white px-6 font-bold text-stone-900 dark:border-white/10 dark:bg-zinc-900 dark:text-stone-100"
          to="/discover"
        >
          Keşfet
        </Link>
      </div>
    </section>
  );
}
