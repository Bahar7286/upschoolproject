import { MapPin } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  firstName?: string;
  effectiveCity: string;
  effectiveInterests: string[];
  onboardingCompleted?: boolean;
};

export function DiscoverHero({
  firstName,
  effectiveCity,
  effectiveInterests,
  onboardingCompleted,
}: Props): ReactElement {
  return (
    <header className="space-y-1">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-theme md:text-4xl" id="disc-title">
        {firstName ? `Merhaba, ${firstName}! 👋` : 'Rota keşfi'}
      </h1>
      <p className="text-sm leading-relaxed text-theme-muted md:text-base">
        İlgi alanın, süren ve bütçene göre sana en uygun rotaları öneririz.
      </p>
      {onboardingCompleted ? (
        <p className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {effectiveCity}
          <span className="text-stone-400">·</span>
          {effectiveInterests.slice(0, 3).join(', ')}
          {effectiveInterests.length > 3 ? '…' : ''}
          <Link className="text-primary underline-offset-2 hover:underline" to="/onboarding">
            Tercihleri düzenle
          </Link>
        </p>
      ) : (
        <Link className="inline-flex text-sm font-bold text-primary underline-offset-4 hover:underline" to="/onboarding">
          Kişisel rotanı oluştur →
        </Link>
      )}
    </header>
  );
}
