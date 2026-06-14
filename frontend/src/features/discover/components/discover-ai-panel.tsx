import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';

import { useI18n } from '../../../lib/i18n';

type Props = {
  showAiPanel: boolean;
  effectiveInterests: string[];
  effectiveDuration: number;
  effectiveBudget: number;
  effectiveCity: string;
  isGenerating: boolean;
  hasPersonalRoute: boolean;
  hasRecommendData: boolean;
  onGenerate: () => void;
  onClearPersonal: () => void;
  onClearRecommend: () => void;
};

export function DiscoverAiPanel({
  showAiPanel,
  effectiveInterests,
  effectiveDuration,
  effectiveBudget,
  effectiveCity,
  isGenerating,
  hasPersonalRoute,
  hasRecommendData,
  onGenerate,
  onClearPersonal,
  onClearRecommend,
}: Props): ReactElement {
  const { t } = useI18n();

  return (
    <div
      className={`rounded-[22px] border p-5 transition ${
        showAiPanel
          ? 'border-primary/35 bg-primary/8 dark:border-primary/40 dark:bg-primary/15'
          : 'border-primary/25 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
      }`}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-primary-dark dark:text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {t('discover.aiWizard', 'AI Rota Sihirbazı')}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('discover.aiWizardHint', 'Eşleşme skoru, bütçe uyumu, süre ve konum yakınlığı birlikte hesaplanır.')}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t('discover.interests', 'İlgi alanları')}
          </p>
          <div className="flex flex-wrap gap-2">
            {effectiveInterests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-primary/25 bg-white px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-zinc-900 dark:text-stone-200"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm dark:bg-zinc-900 dark:text-stone-200">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {effectiveDuration} {t('discover.minutes', 'dk')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm dark:bg-zinc-900 dark:text-stone-200">
            ₺{effectiveBudget}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm dark:bg-zinc-900 dark:text-stone-200">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {effectiveCity}
          </span>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <button
            className="tap-scale inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-5 font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-60 sm:flex-1"
            type="button"
            disabled={isGenerating}
            onClick={onGenerate}
          >
            {isGenerating
              ? t('discover.aiLoading', 'Kişisel rota oluşturuluyor…')
              : t('discover.aiCta', 'Kişisel Rotanı Oluştur')}
          </button>
          {hasPersonalRoute ? (
            <button
              className="tap-scale min-h-[48px] rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600 sm:w-auto"
              type="button"
              onClick={onClearPersonal}
            >
              {t('discover.clearRoute', 'Temizle')}
            </button>
          ) : null}
          {hasRecommendData ? (
            <button
              className="tap-scale min-h-[48px] rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold dark:border-zinc-600 sm:w-auto"
              type="button"
              onClick={onClearRecommend}
            >
              {t('discover.allRoutes', 'Tüm rotalar')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
