import { Landmark, Monitor, Moon, Sun } from 'lucide-react';
import type { ReactElement } from 'react';

import type { ThemePreference } from '../../stores/theme-store';
import { useThemeStore } from '../../stores/theme-store';

const ORDER: ThemePreference[] = ['system', 'light', 'dark', 'heritage', 'ocean', 'sunset', 'forest', 'classic'];

function labelFor(pref: ThemePreference): string {
  const labels: Record<string, string> = {
    system: 'Sistem teması',
    light: 'Açık tema',
    dark: 'Koyu tema',
    heritage: 'Miras teması',
    ocean: 'Okyanus teması',
    sunset: 'Gün batımı',
    forest: 'Orman teması',
    classic: 'Klasik tema',
  };
  return labels[pref] ?? pref;
}

function iconFor(pref: ThemePreference) {
  if (pref === 'system') return Monitor;
  if (pref === 'light') return Sun;
  if (pref === 'dark') return Moon;
  return Landmark;
}

const HEADER_ORDER: ThemePreference[] = ['system', 'light', 'dark'];

export function ThemeToggle({
  className = '',
  compact = false,
}: {
  className?: string;
  /** Üst menüde yalnızca sistem/açık/koyu — profilde tüm temalar */
  compact?: boolean;
}): ReactElement {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  const order = compact ? HEADER_ORDER : ORDER;

  const cycle = () => {
    const idx = order.indexOf(preference);
    const next = idx >= 0 ? order[(idx + 1) % order.length] : order[0];
    setPreference(next);
  };

  const Icon = iconFor(preference);

  return (
    <button
      type="button"
      className={`app-chip tap-scale inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors hover:opacity-90 text-theme ${className}`}
      aria-label={`Tema: ${labelFor(preference)}. Değiştirmek için dokunun.`}
      title={`${labelFor(preference)} · Tıklayınca sırayla değişir`}
      onClick={cycle}
    >
      <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
    </button>
  );
}
