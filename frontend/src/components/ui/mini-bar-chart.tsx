import type { ReactElement } from 'react';

export interface BarChartItem {
  label: string;
  value: number;
}

export function MiniBarChart({
  data,
  className = '',
}: {
  data: BarChartItem[];
  className?: string;
}): ReactElement {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`space-y-3 ${className}`} role="img" aria-label="Gelir grafiği">
      {data.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-400">
              <span>{item.label}</span>
              <span>₺{item.value.toFixed(0)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
