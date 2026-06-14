import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { LegalPageShell } from '../components/legal/legal-page-shell';

export default function TermsPage(): ReactElement {
  return (
    <LegalPageShell title="Kullanım Şartları">
      <p>
        Historial-GO&apos;ya kayıt olarak veya ziyaret ederek bu şartları kabul etmiş sayılırsınız. Platform, rehberlerin
        dijital rota içerikleri oluşturabildiği <strong>erken aşama</strong> bir turizm uygulamasıdır.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Hizmet kapsamı</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Şehir ve mekan keşfi, AI destekli rota önerileri, sesli anlatım</li>
        <li>Rehberler tarafından oluşturulan dijital rotaların satın alınması (demo veya Stripe)</li>
        <li>Onaylı rehberlere gezi talebi ve teklif alma</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Kullanıcı yükümlülükleri</h2>
      <p>
        Hesap bilgilerinizi gizli tutun. Satın aldığınız içerikleri yalnızca kişisel kullanım için kullanın; izinsiz
        paylaşım ve yeniden satış yasaktır. Yanıltıcı yorum veya kötü niyetli içerik bildirimi yasaktır.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Rehberler</h2>
      <p>
        Rehber hesapları kokart doğrulamasına tabidir. Doğrulanmamış rehberler &quot;onaylı&quot; rozeti taşıyamaz.
        Detay: <Link className="text-primary underline" to="/rehber-guven">rehber doğrulama</Link>.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Ödeme ve komisyon</h2>
      <p>
        Fiyatlar TL cinsinden gösterilir. Platform komisyonu ödeme özetinde belirtilir.{' '}
        <Link className="text-primary underline" to="/odeme-guvenlik">
          Ödeme güvenliği
        </Link>{' '}
        ve{' '}
        <Link className="text-primary underline" to="/iade">
          iade politikası
        </Link>{' '}
        geçerlidir.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Sorumluluk sınırı</h2>
      <p>
        Tarihî bilgiler rehber ve AI kaynaklıdır; hata riski vardır. Canlı rehberlik hizmetinde sözleşme tarafları gezgin
        ile rehberdir. Platform aracı konumundadır.
      </p>
    </LegalPageShell>
  );
}
