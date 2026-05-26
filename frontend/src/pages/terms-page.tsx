import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { BrandLogo } from '../components/brand/brand-logo';
import { ThemeToggle } from '../components/theme/theme-toggle';
import { ButtonLink } from '../components/ui/button';

export default function TermsPage(): ReactElement {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f4f0e8] to-[#ebe4d8] px-4 py-8 dark:from-zinc-950 dark:to-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <BrandLogo to="/" />
          <ThemeToggle />
        </header>
        <article className="rounded-[22px] border border-stone-900/10 bg-white/90 p-8 shadow-lift dark:border-white/10 dark:bg-zinc-900/95">
          <h1 className="font-display text-3xl font-extrabold text-heritage-ink dark:text-stone-50">Kullanım Koşulları</h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Historial-GO uygulamasını kullanarak rotaları keşfedebilir, sesli rehberlik hizmetlerinden yararlanabilir ve dijital
            içerik satın alabilirsiniz. Platform %15 komisyon modeliyle rehberlere gelir sağlar. Kullanıcılar satın aldıkları
            rotaları kişisel kullanım için indirebilir; içeriklerin izinsiz paylaşımı yasaktır.
          </p>
          <ButtonLink variant="ghost" className="mt-6" to="/register">
            ← Kayıt sayfasına dön
          </ButtonLink>
        </article>
      </div>
    </div>
  );
}
