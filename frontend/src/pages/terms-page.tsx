import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { LegalPageShell } from '../components/legal/legal-page-shell';
import { useI18n } from '../lib/i18n';

export default function TermsPage(): ReactElement {
  const { t } = useI18n();
  return (
    <LegalPageShell title={t('legal.termsTitle', 'Kullanım Şartları')}>
      <p>{t('legal.termsIntro', "Historial-GO'ya kayıt olarak veya ziyaret ederek bu şartları kabul etmiş sayılırsınız.")}</p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">{t('legal.termsScopeTitle', 'Hizmet kapsamı')}</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>{t('legal.termsScope1', 'Şehir ve mekan keşfi, AI destekli rota önerileri, sesli anlatım')}</li>
        <li>{t('legal.termsScope2', 'Rehberler tarafından oluşturulan dijital rotaların satın alınması')}</li>
        <li>{t('legal.termsScope3', 'Onaylı rehberlere gezi talebi ve teklif alma')}</li>
      </ul>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">{t('legal.termsUserTitle', 'Kullanıcı yükümlülükleri')}</h2>
      <p>{t('legal.termsUserBody', 'Hesap bilgilerinizi gizli tutun. Satın aldığınız içerikleri yalnızca kişisel kullanım için kullanın.')}</p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">{t('legal.termsGuideTitle', 'Rehberler')}</h2>
      <p>
        {t('legal.termsGuideBody', 'Rehber hesapları kokart doğrulamasına tabidir.')}{' '}
        <Link className="text-primary underline" to="/rehber-guven">{t('legal.termsGuideLink', 'rehber doğrulama')}</Link>.
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">{t('legal.termsPaymentTitle', 'Ödeme ve komisyon')}</h2>
      <p>
        {t('legal.termsPaymentBody', 'Fiyatlar TL cinsinden gösterilir.')}{' '}
        <Link className="text-primary underline" to="/odeme-guvenlik">{t('legal.termsPaymentSecurity', 'Ödeme güvenliği')}</Link>
        {' · '}
        <Link className="text-primary underline" to="/iade">{t('legal.termsRefund', 'iade politikası')}</Link>
        {' '}{t('legal.termsPaymentSuffix', 'geçerlidir.')}
      </p>
      <h2 className="font-bold text-heritage-ink dark:text-stone-100">{t('legal.termsLiabilityTitle', 'Sorumluluk sınırı')}</h2>
      <p>{t('legal.termsLiabilityBody', 'Tarihî bilgiler rehber ve AI kaynaklıdır; hata riski vardır.')}</p>
    </LegalPageShell>
  );
}
