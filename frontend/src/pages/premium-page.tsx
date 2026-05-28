import { Crown, Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

export default function PremiumPage(): ReactElement {
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
          Şimdilik ödeme entegrasyonu yok. Premium erişimi admin tarafından açılıyor.
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

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          className="tap-scale inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-6 font-bold text-white"
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

