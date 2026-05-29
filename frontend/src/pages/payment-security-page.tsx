import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function PaymentSecurityPage(): ReactElement {
  return (
    <LegalPageShell title="Ödeme Güvenliği">
      <p>
        Ödemeleriniz güvenli ödeme altyapısı üzerinden işlenir. Kart bilgileriniz Historial-GO sunucularında tam
        olarak saklanmaz.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Güvenli ödeme</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Kart bilgisi tarayıcıdan doğrudan ödeme sağlayıcısına iletilir.</li>
        <li>3D Secure ve PCI uyumlu altyapı ödeme ortağı tarafından sağlanır.</li>
        <li>İşlem sonrası yalnızca son 4 hane ve referans kodu saklanır.</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Test ortamı</h2>
      <p>
        Bazı kurulumlarda ödeme yalnızca deneme amaçlıdır; bu durumda gerçek tahsilat yapılmaz ve satın alma kaydı
        eğitim/demo için oluşturulur.
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
