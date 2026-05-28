import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function RefundPage(): ReactElement {
  return (
    <LegalPageShell title="İade ve İptal Politikası">
      <p>
        Historial-GO üzerinden satın alınan dijital rota içerikleri, Mesafeli Sözleşmeler Yönetmeliği kapsamında
        anında ifa edilen dijital hizmetlerdir. İndirme veya rota erişimi başladıktan sonra cayma hakkı kullanılamayabilir.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Dijital rota satın alımları</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Erişim henüz açılmadıysa ve teknik hata platform kaynaklıysa: 14 gün içinde destek talebi ile iade değerlendirilir.</li>
        <li>Yanlışlıkla çift ödeme: tam iade.</li>
        <li>İçerik eksik veya yanıltıcıysa: önce düzeltme; çözülmezse kısmi veya tam iade.</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Canlı rehber / teklif</h2>
      <p>
        Rehberle yüz yüze gezi talepleri için iptal koşulları teklif kabulünden önce gösterilir. Kabul sonrası iptal,
        rehber ve platform kurallarına tabidir.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Demo ödeme</h2>
      <p>
        Stripe anahtarı yapılandırılmamış ortamlarda gerçek para tahsil edilmez; demo işlemler iade gerektirmez.
      </p>
      <p>
        Talep için{' '}
        <a className="font-semibold text-primary underline" href="/iletisim">
          iletişim
        </a>{' '}
        sayfasını kullanın; satın alma referans numaranızı ekleyin.
      </p>
    </LegalPageShell>
  );
}
