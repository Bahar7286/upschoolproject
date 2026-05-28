import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function PrivacyPage(): ReactElement {
  return (
    <LegalPageShell title="Gizlilik Politikası">
      <p>
        Historial-GO, kişisel verilerinizi şeffaf ve asgari düzeyde işler. Ayrıntılı aydınlatma için{' '}
        <Link className="font-semibold text-primary underline" to="/kvkk">
          KVKK metni
        </Link>{' '}
        ve{' '}
        <Link className="font-semibold text-primary underline" to="/cerezler">
          çerez politikası
        </Link>{' '}
        sayfalarına bakın.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Topladığımız veriler</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>E-posta, ad, rol (turist / rehber)</li>
        <li>Onboarding tercihleri (ilgi, süre, bütçe)</li>
        <li>Konum (yalnızca izin verdiğinizde, harita ve rota için)</li>
        <li>Satın alma ve favori kayıtları</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Saklama</h2>
      <p>
        JWT oturum bilgisi cihazınızda saklanır. Sunucuda şifreli parola özeti tutulur. Üçüncü taraflarla veri satışı
        yapılmaz.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Haklarınız</h2>
      <p>
        Verilerinize erişim, düzeltme ve silme talebi için{' '}
        <Link className="font-semibold text-primary underline" to="/iletisim">
          iletişim
        </Link>{' '}
        sayfasını kullanın.
      </p>
    </LegalPageShell>
  );
}
