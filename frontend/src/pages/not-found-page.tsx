import { Compass } from 'lucide-react';
import type { ReactElement } from 'react';

import { BrandLogo } from '../components/brand/brand-logo';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { ButtonLink } from '../components/ui/button';

export default function NotFoundPage(): ReactElement {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-[#f4f0e8] via-[#ebe4d8] to-[#e2dbd2] px-4 py-8 dark:from-zinc-950 dark:via-zinc-950 dark:to-black">
      <div className="relative mx-auto flex max-w-md flex-col gap-8">
        <header className="flex items-start justify-between">
          <BrandLogo to="/" />
          <ThemeToggle />
        </header>

        <section className="rounded-[22px] border border-stone-900/10 bg-white/90 p-8 text-center shadow-lift dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-lift-dark">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800">
            <Compass className="h-8 w-8 text-stone-400" aria-hidden="true" strokeWidth={2} />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-heritage-ink dark:text-stone-50">Sayfa bulunamadı</h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Aradığın rota başka bir sokakta olabilir.</p>
          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink to="/discover">Keşfe dön</ButtonLink>
            <ButtonLink variant="secondary" to="/cities">
              İlleri keşfet
            </ButtonLink>
            <ButtonLink variant="secondary" to="/map">
              Harita
            </ButtonLink>
            <ButtonLink variant="ghost" to="/">
              Ana sayfa
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
