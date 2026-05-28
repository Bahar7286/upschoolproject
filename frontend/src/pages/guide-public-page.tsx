import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';

import { VerifiedGuideBadge } from '../components/guide/verified-guide-badge';
import { formatApiError } from '../lib/api';
import { getGuidePublicProfile, type GuideProfile } from '../services/guide-profile-service';
import { useAuthStore } from '../stores/auth-store';

export default function GuidePublicPage(): ReactElement {
  const { guideId } = useParams();
  const id = Number(guideId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getGuidePublicProfile(id).then(setGuide).catch((e) => setError(formatApiError(e)));
  }, [id]);

  if (!guide) {
    return error ? (
      <p className="text-sm font-semibold text-red-700" role="alert">
        {error}
      </p>
    ) : (
      <div className="h-40 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" />
    );
  }

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link className="text-sm font-bold text-primary hover:underline" to="/rehberler">
        ← Rehber listesi
      </Link>

      <header className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/95">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold">{guide.full_name}</h1>
          <VerifiedGuideBadge verified={guide.verification_status === 'verified' || guide.is_verified} />
          {guide.verification_status !== 'verified' && !guide.is_verified ? (
            <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600 dark:bg-zinc-800 dark:text-stone-400">
              Doğrulama sürecinde
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{guide.bio}</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-stone-500">Üniversite</dt>
            <dd>{guide.university} — {guide.department}</dd>
          </div>
          <div>
            <dt className="font-bold text-stone-500">Kokart / ruhsat</dt>
            <dd>{guide.license_number}</dd>
          </div>
          <div>
            <dt className="font-bold text-stone-500">Diller</dt>
            <dd>{guide.languages.join(', ')}</dd>
          </div>
          <div>
            <dt className="font-bold text-stone-500">Bölgeler</dt>
            <dd>{guide.regions.join(', ')}</dd>
          </div>
        </dl>
      </header>

      <section className="rounded-[22px] border border-primary/25 bg-primary/5 p-5 dark:bg-primary/10">
        <h2 className="font-display text-lg font-bold">Gezi talebi oluştur</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Gezi talebinizi yayınlayın; {guide.full_name} ve diğer onaylı rehberler size teklif gönderebilir. 10+ kişide
          otomatik grup indirimi uygulanır.
        </p>
        {!accessToken ? (
          <p className="mt-4 text-sm">
            <Link className="font-bold text-primary underline" to="/login">
              Giriş yap
            </Link>{' '}
            veya{' '}
            <Link className="font-bold text-primary underline" to="/register">
              gezgin olarak kayıt ol
            </Link>
          </p>
        ) : user?.role === 'tourist' || user?.role === 'admin' ? (
          <div className="mt-4 space-y-3">
            <Link
              className="tap-scale flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-sm hover:bg-primary-dark"
              to="/talepler/yeni"
              state={{ preferredGuide: guide.full_name, guideId: guide.guide_id }}
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
              Gezi talebi oluştur
            </Link>
            <Link className="block text-center text-sm font-bold text-primary" to="/talepler">
              Taleplerime git →
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">Gezi talebi yalnızca turist hesapları içindir.</p>
        )}
      </section>
    </article>
  );
}
