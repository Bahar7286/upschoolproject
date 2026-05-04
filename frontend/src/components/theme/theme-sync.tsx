import { useEffect } from 'react';

import { getResolvedTheme, useThemeStore } from '../../stores/theme-store';

/** `html.dark` + `data-theme` — Tailwind `dark:` varyantları ve düşük ışık UX için. */
export function ThemeSync(): null {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const resolved = getResolvedTheme(useThemeStore.getState().preference);
      root.classList.toggle('dark', resolved === 'dark');
      root.dataset.theme = resolved;
    };

    apply();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  return null;
}
