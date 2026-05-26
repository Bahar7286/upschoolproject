import { useEffect } from 'react';

import { getResolvedTheme, useThemeStore, type FontPreference } from '../../stores/theme-store';

const FONT_CLASS: Record<FontPreference, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  rounded: 'font-rounded',
};

/** `html.dark` + `data-theme` + font sınıfı */
export function ThemeSync(): null {
  const preference = useThemeStore((s) => s.preference);
  const font = useThemeStore((s) => s.font);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const pref = useThemeStore.getState().preference;
      const systemDark =
        typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = pref === 'dark' || (pref === 'system' && systemDark);
      root.classList.toggle('dark', isDark);
      const themeKey = pref === 'system' ? (isDark ? 'dark' : 'light') : pref;
      root.dataset.theme = themeKey;
      root.dataset.mode = isDark ? 'dark' : 'light';
      root.dataset.font = useThemeStore.getState().font;
      root.classList.remove('font-sans', 'font-serif', 'font-rounded');
      root.classList.add(FONT_CLASS[useThemeStore.getState().font]);
    };

    apply();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference, font]);

  return null;
}
