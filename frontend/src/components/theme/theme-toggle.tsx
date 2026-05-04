import { Monitor, Moon, Sun } from 'lucide-react';
import type { ReactElement } from 'react';

import type { ThemePreference } from '../../stores/theme-store';
import { useThemeStore } from '../../stores/theme-store';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

function labelFor(pref: ThemePreference): string {
  if (pref === 'system') return 'Sistem teması';
  if (pref === 'light') return 'Açık tema';
  return 'Koyu tema';
}

export function ThemeToggle({ className = '' }: { className?: string }): ReactElement {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const cycle = () => {
    const idx = ORDER.indexOf(preference);
    setPreference(ORDER[(idx + 1) % ORDER.length]);
  };

  const Icon = preference === 'system' ? Monitor : preference === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      className={`tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-900/10 bg-white/80 text-heritage-ink shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-900/80 dark:text-stone-100 dark:hover:bg-zinc-800 ${className}`}
      aria-label={`Tema: ${labelFor(preference)}. Değiştirmek için dokunun.`}
      title={`${labelFor(preference)} · Tıklayınca sırayla değişir`}
      onClick={cycle}
    >
      <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
    </button>
  );
}
