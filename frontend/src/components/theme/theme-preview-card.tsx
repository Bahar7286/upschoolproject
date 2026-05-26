import type { ReactElement } from 'react';
import { Check } from 'lucide-react';

import type { ThemeMeta } from '../../lib/theme-meta';

type Props = {
  meta: ThemeMeta;
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export function ThemePreviewCard({ meta, label, selected, onSelect }: Props): ReactElement {
  return (
    <button
      className={`theme-preview-card tap-scale group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-all ${
        selected ? 'border-[var(--hg-primary)] ring-2 ring-[var(--hg-primary)]/35' : 'hover:border-[var(--hg-primary)]/45'
      }`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div
        className="mb-2 h-14 rounded-xl shadow-inner ring-1 ring-[var(--hg-border)]"
        style={{ background: `linear-gradient(135deg, ${meta.swatch} 0%, ${meta.swatchAlt} 100%)` }}
        aria-hidden="true"
      />
      <p className="text-sm font-bold text-theme">{label}</p>
      <p className="theme-preview-mood text-[11px] font-semibold">{meta.mood}</p>
      <p className="theme-preview-tagline mt-0.5 text-[11px] leading-snug">{meta.tagline}</p>
      {selected ? (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}
