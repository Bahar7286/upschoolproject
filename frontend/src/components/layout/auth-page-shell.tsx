import type { ReactElement, ReactNode } from 'react';

/** Landing / giriş / kayıt — uygulama temasıyla uyumlu arka plan */
export function AuthPageShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div
      className={`relative min-h-dvh overflow-hidden text-theme transition-colors duration-300 ${className}`}
      style={{ background: 'var(--hg-bg)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-35"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(900px 520px at 80% -10%, rgb(201 162 39 / 18%), transparent 55%), radial-gradient(700px 420px at 10% 90%, rgb(29 185 84 / 10%), transparent 50%)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
