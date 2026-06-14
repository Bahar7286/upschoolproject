import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { SUPPORT_EMAIL } from '../config/contact';

export default function KvkkPage(): ReactElement {
  return (
    <LegalPageShell title="KVKK Aydınlatma Metni">
      <p>
        <strong>Veri sorumlusu:</strong> Historial-GO (erken erişim turizm platformu). İletişim:{' '}
        <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">İşlenen veriler</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Kimlik ve iletişim: ad, e-posta (kayıt)</li>
        <li>Konum: harita, rota ve sesli rehber özellikleri için (izinle)</li>
        <li>İşlem: satın alma kayıtları, teklif/talep mesajları</li>
        <li>Teknik: oturum token&apos;ı, cihaz türü, hata günlükleri</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Amaç ve hukuki sebep</h2>
      <p>
        Veriler; hesap oluşturma, rota önerisi, ödeme kaydı, rehber doğrulama ve destek taleplerini yürütmek için 6698
        sayılı Kanun&apos;un 5/2-c (sözleşme) ve 5/2-f (meşru menfaat) kapsamında işlenir. Konum verisi yalnızca açık
        rızanızla kullanılır.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Aktarım</h2>
      <p>
        Harita ve mekan verileri harita hizmet sağlayıcıları üzerinden; yapay zekâ destekli anlatımlar güvenli sunucu
        altyapısı ile işlenebilir.
        Ödeme Stripe kullanıldığında kart verileri doğrudan Stripe&apos;a gider, platform kart numarasını saklamaz.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Haklarınız</h2>
      <p>
        KVKK md. 11 kapsamında erişim, düzeltme, silme, itiraz ve şikâyet hakkınız vardır. Taleplerinizi{' '}
        <a className="font-semibold text-primary underline" href="/iletisim">
          iletişim
        </a>{' '}
        sayfasından iletebilirsiniz.
      </p>
    </LegalPageShell>
  );
}
