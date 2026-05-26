import { useCallback, useEffect, useRef, useState } from 'react';

export function langToSpeechCode(lang: string): string {
  if (lang === 'en') return 'en-US';
  if (lang === 'de') return 'de-DE';
  return 'tr-TR';
}

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setProgress(0);
  }, []);

  const speak = useCallback(
    (text: string, lang = 'tr-TR') => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
      stop();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.95;
      utter.onstart = () => {
        setSpeaking(true);
        setProgress(0);
      };
      utter.onend = () => {
        setSpeaking(false);
        setProgress(100);
      };
      utter.onerror = () => {
        setSpeaking(false);
        setProgress(0);
      };
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [stop],
  );

  useEffect(() => () => stop(), [stop]);

  return {
    speak,
    stop,
    speaking,
    progress,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}

let activeAudio: HTMLAudioElement | null = null;

export function stopActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
}

export function playAudioBase64(base64: string, contentType = 'audio/mpeg'): Promise<void> {
  stopActiveAudio();
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:${contentType};base64,${base64}`);
    activeAudio = audio;
    audio.onended = () => {
      activeAudio = null;
      resolve();
    };
    audio.onerror = () => {
      activeAudio = null;
      reject(new Error('Ses çalınamadı'));
    };
    void audio.play().catch(reject);
  });
}

/** Yer detay sayfası için kısa sarmalayıcı */
export function useSpeech() {
  const { speak, stop, speaking, supported } = useSpeechSynthesis();
  return {
    speak: (text: string, lang = 'tr-TR') => speak(text, lang),
    stop,
    speaking,
    supported,
  };
}
