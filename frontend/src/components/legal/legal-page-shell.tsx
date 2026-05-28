import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { BrandLogo } from '../brand/brand-logo';
import { ThemeToggle } from '../theme/theme-toggle';
import { SiteFooter } from './site-footer';

export function LegalPageShell({
  title,
  updated = 'Mayıs 2026',
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f4f0e8] to-[#ebe4d8] px-4 py-8 dark:from-zinc-950 dark:to-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <BrandLogo to="/" />
          <ThemeToggle />
        </header>
        <article className="rounded-[22px] border border-stone-900/10 bg-white/90 p-6 shadow-lift sm:p-8 dark:border-white/10 dark:bg-zinc-900/95">
          <h1 className="font-display text-2xl font-extrabold text-heritage-ink sm:text-3xl dark:text-stone-50">
            {title}
          </h1>
          <p className="mt-1 text-xs text-stone-500">Son güncelleme: {updated}</p>
          <div className="prose prose-stone mt-6 max-w-none space-y-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {children}
          </div>
          <Link className="mt-8 inline-flex min-h-[44px] items-center text-sm font-bold text-primary hover:underline" to="/">
            ← Ana sayfa
          </Link>
        </article>
        <SiteFooter />
      </div>
    </div>
  );
}
