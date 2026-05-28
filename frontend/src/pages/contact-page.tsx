import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquareWarning } from 'lucide-react';

import { LegalPageShell } from '../components/legal/legal-page-shell';

const SUPPORT_EMAIL = 'destek@historial-go.example';

export default function ContactPage(): ReactElement {
  return (
    <LegalPageShell title="İletişim ve Destek">
      <p>
        Sorularınız, KVKK talepleriniz, iade istekleriniz ve içerik bildirimleriniz için bize yazın. Yanıt süresi
        hedefi: iş günlerinde 48 saat (erken erişim dönemi).
      </p>

      <div className="space-y-4 rounded-xl border border-stone-900/10 bg-stone-50 p-4 dark:border-white/10 dark:bg-zinc-800/50">
        <a
          className="flex items-center gap-3 font-semibold text-primary hover:underline"
          href={`mailto:${SUPPORT_EMAIL}?subject=Historial-GO%20Destek`}
        >
          <Mail className="h-5 w-5" aria-hidden="true" />
          {SUPPORT_EMAIL}
        </a>
        <a
          className="flex items-center gap-3 font-semibold text-primary hover:underline"
          href={`mailto:${SUPPORT_EMAIL}?subject=İçerik%20bildirimi&body=Rota%20veya%20mekan%20URL:%0AYanlış%20bilgi%20açıklaması:`}
        >
          <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
          Kötü / yanlış içerik bildir
        </a>
      </div>

      <h2 className="font-bold text-heritage-ink dark:text-stone-100">Sık konular</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <Link className="text-primary underline" to="/iade">
            İade ve iptal
          </Link>
        </li>
        <li>
          <Link className="text-primary underline" to="/rehber-guven">
            Rehber doğrulama
          </Link>
        </li>
        <li>
          <Link className="text-primary underline" to="/odeme-guvenlik">
            Ödeme güvenliği
          </Link>
        </li>
        <li>
          <Link className="text-primary underline" to="/kvkk">
            KVKK
          </Link>
        </li>
      </ul>
    </LegalPageShell>
  );
}
