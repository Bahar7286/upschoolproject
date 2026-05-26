import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, X } from 'lucide-react';

import { formatApiError } from '../lib/api';
import {
  documentUrl,
  listPendingGuides,
  moderateGuide,
  type AdminPendingGuide,
} from '../services/admin-service';
import { useAuthStore } from '../stores/auth-store';

export default function AdminPage(): ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [pending, setPending] = useState<AdminPendingGuide[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    if (!accessToken) return;
    try {
      setPending(await listPendingGuides(accessToken));
      setError('');
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  if (user?.role !== 'admin') {
    return (
      <section className="mx-auto max-w-lg space-y-4">
        <h1 className="font-display text-2xl font-bold">Yönetim paneli</h1>
        <p className="text-sm text-stone-600">Bu sayfa yalnızca platform yöneticileri içindir.</p>
        <p className="text-xs text-stone-500">Demo: admin@example.com / demo123</p>
        <Link className="font-bold text-primary" to="/login">
          Giriş
        </Link>
      </section>
    );
  }

  const handleAction = async (guideId: number, action: 'verify' | 'reject') => {
    if (!accessToken) return;
    const reason =
      action === 'reject'
        ? window.prompt('Red gerekçesi (isteğe bağlı):', 'Belgeler eksik veya okunamıyor') ?? ''
        : '';
    setBusyId(guideId);
    try {
      await moderateGuide(accessToken, guideId, action, reason);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Rehber başvuruları</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Kokart / belge yüklemelerini inceleyin; onaylanan rehberler pazaryerinde listelenir.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      {pending.length === 0 ? (
        <p className="rounded-[22px] border border-dashed px-4 py-10 text-center text-sm text-stone-500">
          Bekleyen başvuru yok.
        </p>
      ) : (
        <ul className="space-y-4">
          {pending.map((g) => (
            <li
              key={g.guide_id}
              className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-bold text-heritage-ink dark:text-stone-50">{g.full_name}</h2>
                  <p className="text-xs text-stone-500">{g.email}</p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold">{g.verification_status}</span>
              </div>
              <p className="mt-2 break-anywhere text-sm">
                {g.license_number} · {g.university} · {g.department}
              </p>
              <p className="mt-1 text-xs text-stone-500 line-clamp-3">{g.document_summary}</p>
              {g.document_path ? (
                <a
                  className="tap-scale mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                  href={documentUrl(g.document_path)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Belgeyi aç (PDF / görsel)
                </a>
              ) : (
                <p className="mt-2 text-xs text-heritage-ember">Belge henüz yüklenmemiş</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-60"
                  disabled={busyId === g.guide_id}
                  type="button"
                  onClick={() => handleAction(g.guide_id, 'verify')}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Onayla
                </button>
                <button
                  className="tap-scale inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-heritage-ember px-4 text-sm font-bold text-heritage-ember disabled:opacity-60"
                  disabled={busyId === g.guide_id}
                  type="button"
                  onClick={() => handleAction(g.guide_id, 'reject')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Reddet
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
