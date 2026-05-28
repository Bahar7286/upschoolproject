import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function CookiesPage(): ReactElement {
  return (
    <LegalPageShell title="Çerez Politikası">
      <p>
        Historial-GO, oturumunuzu açık tutmak, tema tercihinizi hatırlamak ve güvenli API çağrıları yapmak için
        çerezler ve yerel depolama (localStorage) kullanır.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Zorunlu</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Oturum / JWT: giriş yaptıktan sonra kimliğinizi doğrulamak için</li>
        <li>Tema ve dil tercihleri: kullanıcı deneyimi</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Üçüncü taraf</h2>
      <p>
        Google Haritalar yüklenirken Google kendi çerezlerini kullanabilir. Stripe ödeme sayfasına yönlendirildiğinizde
        Stripe çerez politikası geçerlidir.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Yönetim</h2>
      <p>
        Tarayıcı ayarlarından çerezleri silebilirsiniz; oturum çerezlerini silmek çıkış yapmanıza neden olur. Analitik
        çerez şu an zorunlu değildir; ileride eklenecekse bu sayfa güncellenecektir.
      </p>
    </LegalPageShell>
  );
}
