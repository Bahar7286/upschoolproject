import { MapPin } from 'lucide-react';
import type { ReactElement } from 'react';

export function MapLoadingOverlay({ message = 'Harita yükleniyor…' }: { message?: string }): ReactElement {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-stone-900/20 backdrop-blur-[2px] dark:bg-black/40"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-xl bg-white/95 px-4 py-3 shadow-lg dark:bg-zinc-900/95">
        <MapPin className="h-5 w-5 animate-pulse text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">{message}</span>
      </div>
    </div>
  );
}
