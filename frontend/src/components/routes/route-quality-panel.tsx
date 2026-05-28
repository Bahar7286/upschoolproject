import { BadgeCheck, Clock, MapPin, Star, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import type { GuideProfile } from '../../services/guide-profile-service';
import { VerifiedGuideBadge } from '../guide/verified-guide-badge';
import type { RouteResponse } from '../../types/route';
import type { StopResponse } from '../../types/stop';

function estimateWalkKm(stops: StopResponse[]): number | null {
  if (stops.length < 2) return null;
  let total = 0;
  for (let i = 1; i < stops.length; i += 1) {
    const a = stops[i - 1];
    const b = stops[i];
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.latitude * Math.PI) / 180) *
        Math.cos((b.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  return Math.round(total * 10) / 10;
}

export function RouteQualityPanel({
  route,
  stops,
  guide,
  stripeEnabled,
  avgRating,
}: {
  route: RouteResponse;
  stops: StopResponse[];
  guide: GuideProfile | null;
  stripeEnabled: boolean;
  avgRating?: number | null;
}): ReactElement {
  const walkKm = estimateWalkKm(stops);
  const difficulty =
    route.estimated_minutes > 180 ? 'Zor' : route.estimated_minutes > 90 ? 'Orta' : 'Kolay';
  const languages = guide?.languages?.length ? guide.languages.join(', ') : 'TR (varsayılan)';

  const rows: { label: string; value: string; ok: boolean }[] = [
    { label: 'Rota başlığı', value: route.title, ok: true },
    { label: 'Şehir', value: route.city, ok: true },
    { label: 'Tahmini süre', value: `${route.estimated_minutes} dk`, ok: route.estimated_minutes > 0 },
    { label: 'Yürüyüş (tahmini)', value: walkKm != null ? `~${walkKm} km` : 'Haritada hesaplanır', ok: walkKm != null },
    { label: 'Durak sayısı', value: String(stops.length), ok: stops.length > 0 },
    { label: 'Zorluk', value: difficulty, ok: true },
    { label: 'Dil', value: languages, ok: true },
    { label: 'Sesli anlatım', value: stops.length ? 'Durak başına örnek dinle' : 'Yakında', ok: stops.length > 0 },
    { label: 'Harita', value: 'Durak koordinatları mevcut', ok: stops.length > 0 },
    {
      label: 'Kullanıcı puanı',
      value: avgRating != null ? `${avgRating.toFixed(1)} / 5` : 'Henüz yorum yok',
      ok: avgRating != null,
    },
    {
      label: 'Rehber',
      value: guide ? guide.full_name : `Rehber #${route.guide_id}`,
      ok: Boolean(guide),
    },
    { label: 'Fiyat', value: `₺${route.price.toFixed(2)}`, ok: route.price >= 0 },
    {
      label: 'Ödeme',
      value: stripeEnabled ? 'Stripe ile güvenli ödeme' : 'Demo ödeme (gerçek tahsilat yok)',
      ok: true,
    },
    { label: 'İade', value: 'Dijital içerik — 14 gün içinde destek', ok: true },
    {
      label: 'Kimler için?',
      value: route.tags.length ? route.tags.join(', ') : 'Genel kültür gezisi',
      ok: route.tags.length > 0,
    },
  ];

  return (
    <section className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
      <h2 className="font-display text-lg font-bold">Bu rotada ne var?</h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Satın almadan önce süre, duraklar ve rehber bilgisini kontrol edin.
      </p>

      {guide ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-stone-50 p-3 dark:bg-zinc-800/80">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <Link className="font-semibold text-primary hover:underline" to={`/rehberler/${guide.guide_id}`}>
            {guide.full_name}
          </Link>
          {guide.verification_status === 'verified' ? <VerifiedGuideBadge compact /> : null}
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-start justify-between gap-3 border-b border-stone-900/5 py-2 text-sm last:border-0 dark:border-white/5"
          >
            <span className="text-stone-500">{row.label}</span>
            <span className={`max-w-[58%] text-right font-medium ${row.ok ? 'text-stone-800 dark:text-stone-200' : 'text-amber-700'}`}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {route.estimated_minutes} dk
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {stops.length} durak
        </span>
        {avgRating != null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> {avgRating.toFixed(1)}
          </span>
        ) : null}
        {guide?.verification_status === 'verified' ? (
          <span className="inline-flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Doğrulanmış
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-stone-500">
        Tarihî bilgiler rehber ve AI destekli anlatımlardan gelir; kritik kararlar için resmî kaynakları da kontrol edin.{' '}
        <Link className="font-semibold text-primary underline" to="/iletisim">
          İçerik bildir
        </Link>
      </p>
    </section>
  );
}
