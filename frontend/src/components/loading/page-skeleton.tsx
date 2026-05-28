import type { ReactElement } from 'react';

export function ListSkeleton({ count = 4 }: { count?: number }): ReactElement {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-[22px] bg-stone-200 dark:bg-zinc-800"
        />
      ))}
    </div>
  );
}

export function PageSkeleton(): ReactElement {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Sayfa yükleniyor">
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-stone-200 dark:bg-zinc-800" />
      <div className="h-4 w-full max-w-lg animate-pulse rounded bg-stone-200 dark:bg-zinc-800" />
      <ListSkeleton count={5} />
    </div>
  );
}
