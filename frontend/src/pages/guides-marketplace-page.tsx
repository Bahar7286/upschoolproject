import { Languages, MapPin, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { VerifiedGuideBadge } from '../components/guide/verified-guide-badge';
import { formatApiError } from '../lib/api';
import { listVerifiedGuides, type GuideMarketplaceItem } from '../services/guide-profile-service';

export default function GuidesMarketplacePage(): ReactElement {
  const [guides, setGuides] = useState<GuideMarketplaceItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listVerifiedGuides();
        setGuides(data.items);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="space-y-6" aria-labelledby="guides-title">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-heritage-ink dark:text-stone-50" id="guides-title">
          Onaylı rehberler
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Rehberlerin dijital rota içerikleri oluşturabildiği erken aşama platform. Listede yalnızca kokart doğrulaması
          tamamlanmış rehberler yer alır.
        </p>
        <Link className="mt-2 inline-block text-sm font-bold text-primary hover:underline" to="/rehber-guven">
          Doğrulama süreci nasıl işler? →
        </Link>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((k) => (
            <div key={k} className="h-48 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800" />
          ))}
        </div>
      ) : guides.length === 0 ? (
        <p className="rounded-[22px] border border-dashed border-stone-300 px-6 py-10 text-center text-sm text-stone-600">
          Henüz onaylı rehber yok. Demo için <strong>guide@example.com</strong> hesabı doğrulanmıştır.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <article
              key={g.guide_id}
              className="flex flex-col rounded-[22px] border border-stone-900/10 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/95"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold">{g.full_name}</h2>
                <VerifiedGuideBadge compact verified={g.is_verified || g.verification_status === 'verified'} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-400">{g.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {g.trust_badges.map((b) => (
                  <span key={b} className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold dark:bg-zinc-800">
                    {b}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-1 text-xs text-stone-500">
                <li className="flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                  {g.languages.join(', ')}
                </li>
                <li className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {g.regions.join(', ')}
                </li>
                <li className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Grup {g.min_group_size}–{g.max_group_size} kişi
                </li>
              </ul>
              <p className="mt-3 text-sm font-bold text-primary">
                Kişi başı ~₺{g.base_price_per_person.toFixed(0)} · {g.route_count} rota
              </p>
              <Link
                className="tap-scale mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary font-bold text-white"
                to={`/rehberler/${g.guide_id}`}
              >
                Profil ve teklif iste
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
