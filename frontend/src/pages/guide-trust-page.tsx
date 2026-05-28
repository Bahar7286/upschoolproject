import type { ReactElement } from 'react';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function GuideTrustPage(): ReactElement {
  return (
    <LegalPageShell title="Rehber Doğrulama Açıklaması">
      <p>
        Historial-GO, lisanssız rehberlik riskine karşı{' '}
        <strong>onaylı turist rehberlerini</strong> öne çıkarmayı hedefleyen erken aşama bir platformdur. Pazaryeri
        iddiası, doğrulama süreçleri tamamlanana kadar sınırlıdır.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Doğrulama adımları</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Rehber hesabı ile kayıt ve kokart / lisans bilgisi yükleme</li>
        <li>Platform yöneticisinin belge ve üniversite bilgisini incelemesi</li>
        <li>Onay sonrası profilde &quot;Onaylı rehber&quot; rozeti ve listede görünürlük</li>
      </ol>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Ne garanti edilir?</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Rozet yalnızca <code className="text-xs">verification_status = approved</code> ise gösterilir.</li>
        <li>Kullanıcı rehber profilinde lisans numarası ve eğitim özetini görebilir (rehber paylaştıysa).</li>
        <li>Rota içerikleri yayın öncesi otomatik denetlenmez; şikâyet sonrası admin incelemesi yapılabilir.</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Sorumluluk</h2>
      <p>
        Tarihî anlatımlar rehber, AI ve açık kaynaklardan üretilir. Kritik bilgiler için resmî kaynakları da kontrol
        edin. Platform, rehber ile gezgin arasındaki sözleşmenin tarafı değildir; aracı hizmet sağlar.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Kazanç çekme</h2>
      <p>
        Rehber gelir paylaşımı ve çekim süreci üretim ortamında yapılandırılmadıysa demo panelde gösterilir. Gerçek
        ödeme dağıtımı Stripe Connect veya banka entegrasyonu ile açılacaktır.
      </p>
    </LegalPageShell>
  );
}
