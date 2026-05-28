import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function PaymentSecurityPage(): ReactElement {
  return (
    <LegalPageShell title="Ödeme Güvenliği">
      <p>
        Ödemeleriniz iki modda işlenebilir: <strong>Stripe Checkout</strong> (üretim) veya <strong>demo kart</strong>{' '}
        (geliştirme / anahtar yokken).
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Stripe (önerilen)</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Kart bilgisi tarayıcıdan doğrudan Stripe&apos;a gider; sunucumuz tam kart numarasını saklamaz.</li>
        <li>3D Secure ve PCI uyumlu altyapı Stripe tarafından sağlanır.</li>
        <li>İşlem sonrası yalnızca son 4 hane ve referans kodu saklanır.</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Demo mod</h2>
      <p>
        Backend&apos;de <code className="text-xs">STRIPE_SECRET_KEY</code> tanımlı değilse ödeme sayfası demo kart
        formu gösterir. Bu modda gerçek tahsilat yapılmaz; yalnızca test amaçlı satın alma kaydı oluşur.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Komisyon</h2>
      <p>
        Dijital rota ve teklif ödemelerinde platform komisyonu (varsayılan %15) ödeme özetinde ayrı satır olarak
        gösterilir.
      </p>
      <p>
        Şüpheli işlem bildirimi:{' '}
        <a className="font-semibold text-primary underline" href="/iletisim">
          destek
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
