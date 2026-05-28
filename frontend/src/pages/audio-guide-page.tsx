import { Download, Globe, Pause, Play } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchNarrationAudio } from '../services/ai-service';
import { langToSpeechCode, playAudioBase64, useSpeechSynthesis } from '../hooks/use-speech';
import { loadOfflineRoutePackage, saveOfflineRoutePackage } from '../lib/offline-package';
import { useActiveRouteStore } from '../stores/active-route-store';
import { useOnboardingStore } from '../stores/onboarding-store';

const LANGS = [
  { id: 'tr' as const, label: 'TR' },
  { id: 'en' as const, label: 'EN' },
  { id: 'de' as const, label: 'DE' },
];

export default function AudioGuidePage(): ReactElement {
  const routeTitle = useActiveRouteStore((s) => s.routeTitle);
  const mergedStops = useActiveRouteStore((s) => s.mergedStops)();
  const currentStopIndex = useActiveRouteStore((s) => s.currentStopIndex);
  const setCurrentStopIndex = useActiveRouteStore((s) => s.setCurrentStopIndex);

  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useOnboardingStore((s) => s.setPreferredLanguage);

  const { speak, stop, speaking, progress } = useSpeechSynthesis();
  const [offlineSaved, setOfflineSaved] = useState(false);

  const currentStop = mergedStops[currentStopIndex] ?? mergedStops[0] ?? null;
  const displayTitle = currentStop?.title ?? 'Durak seçilmedi';
  const displayText =
    currentStop?.description ??
    'Aktif rota başlatmak için bir rota satın alın ve "Rotayı Başlat" deyin.';

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const togglePlay = () => {
    void playStopAudio();
  };

  useEffect(() => {
    const pkg = loadOfflineRoutePackage();
    if (pkg && !mergedStops.length) {
      useActiveRouteStore.getState().setActiveRoute(
        pkg.routeId,
        pkg.routeTitle,
        pkg.stops,
        pkg.extraStops ?? [],
      );
      setOfflineSaved(true);
    }
  }, [mergedStops.length]);

  const routeId = useActiveRouteStore((s) => s.routeId);

  const saveOffline = () => {
    if (!mergedStops.length) return;
    try {
      const state = useActiveRouteStore.getState();
      saveOfflineRoutePackage({
        routeId: routeId ?? 0,
        routeTitle,
        stops: state.baseStops,
        extraStops: state.extraStops,
        savedAt: new Date().toISOString(),
      });
      setOfflineSaved(true);
    } catch {
      setOfflineSaved(false);
    }
  };

  const playStopAudio = async () => {
    if (!currentStop) return;
    if (speaking) {
      stop();
      return;
    }
    try {
      const res = await fetchNarrationAudio({
        stop_title: currentStop.title,
        description: currentStop.description || '',
        language: preferredLanguage,
      });
      if (res.audio_base64) {
        await playAudioBase64(res.audio_base64);
      } else {
        speak(res.script || displayText, langToSpeechCode(preferredLanguage));
      }
    } catch {
      speak(displayText, langToSpeechCode(preferredLanguage));
    }
  };

  return (
    <section className="mx-auto max-w-lg space-y-6" aria-labelledby="audio-title">
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heritage-ink dark:text-stone-50" id="audio-title">
          Sesli rehberlik
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {routeTitle ? `Aktif: ${routeTitle}` : 'TR / EN / DE · Sunucu TTS (MP3) · Offline paket destekli'}
        </p>
      </header>

      {!mergedStops.length ? (
        <div className="rounded-[22px] border border-amber-500/35 bg-amber-500/10 p-5 text-center">
          <p className="font-semibold text-amber-950 dark:text-amber-100">Henüz aktif rota yok</p>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">Keşfet&apos;ten bir rota satın alın ve başlatın.</p>
          <Link className="tap-scale mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 font-bold text-white" to="/discover">
            Rotalara git
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[22px] border border-stone-900/10 bg-white/90 shadow-lift dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-lift-dark">
          <div className="flex h-32 items-end justify-center gap-1 bg-gradient-to-br from-heritage-ink to-stone-700 px-6 pb-4">
            {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
              <span
                key={i}
                className={`w-2 rounded-full bg-amber-400/80 transition-all ${speaking ? 'animate-pulse' : ''}`}
                style={{ height: `${h * 48}px` }}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="space-y-4 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Durak {currentStopIndex + 1}/{mergedStops.length}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-heritage-ink dark:text-stone-50">{displayTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{displayText}</p>
            </div>

            <label className="sr-only" htmlFor="seek">
              İlerleme
            </label>
            <input
              id="seek"
              className="h-2 w-full accent-primary"
              type="range"
              min={0}
              max={100}
              value={progress}
              readOnly
              aria-valuenow={progress}
            />

            <div className="flex flex-wrap gap-3">
              <button
                className="tap-scale inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary-dark"
                type="button"
                onClick={togglePlay}
              >
                {speaking ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
                {speaking ? 'Duraklat' : 'Oynat'}
              </button>
              <div className="inline-flex rounded-xl border border-stone-900/10 p-1 dark:border-white/10">
                {LANGS.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`tap-scale rounded-lg px-3 py-2 text-sm font-bold ${
                      preferredLanguage === lang.id ? 'bg-primary text-white' : 'text-stone-600 dark:text-stone-400'
                    }`}
                    onClick={() => setPreferredLanguage(lang.id)}
                  >
                    <Globe className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {lang.label}
                  </button>
                ))}
              </div>
              <button
                className="tap-scale inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold hover:border-stone-900 dark:border-zinc-600"
                type="button"
                onClick={saveOffline}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {offlineSaved ? 'Kaydedildi' : 'Offline kaydet'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="tap-scale flex-1 rounded-xl border border-stone-900/10 py-2 text-sm font-semibold disabled:opacity-40 dark:border-white/10"
                disabled={currentStopIndex <= 0}
                onClick={() => setCurrentStopIndex(currentStopIndex - 1)}
              >
                ← Önceki
              </button>
              <button
                type="button"
                className="tap-scale flex-1 rounded-xl border border-stone-900/10 py-2 text-sm font-semibold disabled:opacity-40 dark:border-white/10"
                disabled={currentStopIndex >= mergedStops.length - 1}
                onClick={() => setCurrentStopIndex(currentStopIndex + 1)}
              >
                Sonraki →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
