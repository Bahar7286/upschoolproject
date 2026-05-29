import { Headphones, Loader2, Volume2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { langToSpeechCode, playAudioBase64, useSpeech } from '../../hooks/use-speech';
import { useI18n } from '../../lib/i18n';
import { fetchNarrationAudio, fetchNarrationPreview } from '../../services/ai-service';

type NarrationLang = 'tr' | 'en';

type PlaceNarrationPanelProps = {
  stopTitle: string;
  description?: string;
  className?: string;
};

export function PlaceNarrationPanel({
  stopTitle,
  description = '',
  className = '',
}: PlaceNarrationPanelProps): ReactElement {
  const { t } = useI18n();
  const { speak, stop, speaking, supported } = useSpeech();
  const [lang, setLang] = useState<NarrationLang>('tr');
  const [audioBusy, setAudioBusy] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ['narration-preview', stopTitle, description.slice(0, 200)],
    queryFn: () =>
      fetchNarrationPreview({
        stop_title: stopTitle,
        description,
        languages: ['tr', 'en'],
      }),
    staleTime: 30 * 60 * 1000,
  });

  const script =
    (lang === 'tr' ? data?.scripts.tr : data?.scripts.en) ||
    data?.scripts.tr ||
    data?.scripts.en ||
    '';

  const handleListen = async () => {
    if (speaking) {
      stop();
      return;
    }
    const text = script || `${stopTitle}. ${description}`.trim();
    setAudioBusy(true);
    try {
      const audio = await fetchNarrationAudio({
        stop_title: stopTitle,
        description,
        language: lang,
      });
      if (audio.audio_base64) {
        await playAudioBase64(audio.audio_base64, audio.content_type);
      } else if (supported) {
        speak(audio.script || text, langToSpeechCode(lang));
      }
    } catch {
      if (supported) speak(text, langToSpeechCode(lang));
    } finally {
      setAudioBusy(false);
    }
  };

  return (
    <section
      className={`rounded-2xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 ${className}`}
      aria-labelledby="narration-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="narration-heading"
          className="inline-flex items-center gap-2 font-display text-lg font-bold"
        >
          <Headphones className="h-5 w-5 text-primary" aria-hidden="true" />
          {t('place.narration', 'Sesli anlatım')}
        </h2>
        <div className="inline-flex rounded-full border border-stone-900/10 bg-white p-0.5 dark:border-white/10 dark:bg-zinc-900">
          {(['tr', 'en'] as const).map((code) => (
            <button
              key={code}
              type="button"
              className={`tap-scale min-h-[36px] rounded-full px-3 text-xs font-bold uppercase ${
                lang === code ? 'bg-primary text-white' : 'text-stone-600 dark:text-stone-400'
              }`}
              onClick={() => setLang(code)}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="mt-3 space-y-2" aria-busy="true">
          <p className="inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            {t('place.narrationLoading', 'Anlatım hazırlanıyor…')}
          </p>
          <div className="h-16 animate-pulse rounded-xl bg-stone-200/80 dark:bg-zinc-800" />
        </div>
      ) : isError ? (
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
          {description || stopTitle}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">{script}</p>
      )}

      {supported || script ? (
        <button
          type="button"
          className="tap-scale mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 font-bold text-white disabled:opacity-60"
          disabled={isPending || audioBusy}
          onClick={() => void handleListen()}
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          {speaking || audioBusy
            ? t('place.narrationStop', 'Durdur')
            : t('place.narrationListen', 'Dinle')}
        </button>
      ) : null}

      {data?.sources?.length ? (
        <ul className="mt-3 space-y-1 text-xs text-stone-500">
          {data.sources.map((s: { title: string; url: string }) => (
            <li key={s.url || s.title}>
              <a className="text-primary underline-offset-2 hover:underline" href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
