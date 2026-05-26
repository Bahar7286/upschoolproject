import type { FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { formatApiError } from '../lib/api';
import {
  listInboxQuotes,
  listSentQuotes,
  respondToQuote,
  type Quote,
} from '../services/quote-service';
import { useAuthStore } from '../stores/auth-store';

export default function QuotesPage(): ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isGuide = user?.role === 'guide';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState('');
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyTotal, setReplyTotal] = useState(0);

  const load = async () => {
    if (!accessToken) return;
    try {
      const data = isGuide ? await listInboxQuotes(accessToken) : await listSentQuotes(accessToken);
      setQuotes(data);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  useEffect(() => {
    load();
  }, [accessToken, isGuide]);

  const handleRespond = async (e: FormEvent, quoteId: number, decline = false) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      await respondToQuote(accessToken, quoteId, {
        guide_reply: decline ? 'Bu tarihte müsait değilim.' : replyText,
        quoted_total: decline ? 1 : replyTotal,
        status: decline ? 'declined' : 'quoted',
      });
      setReplyId(null);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">{isGuide ? 'Teklif kutusu' : 'Tekliflerim'}</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Tüm iletişim platform içinde kalır. Kişi başı ve komisyon özeti rehber yanıtında gösterilir.
        </p>
      </header>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      {quotes.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-stone-500">
          {isGuide ? 'Henüz gelen teklif yok.' : 'Henüz teklif göndermediniz. Onaylı rehberlerden teklif isteyin.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {quotes.map((q) => (
            <li key={q.quote_id} className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-bold">{isGuide ? q.tourist_name : q.guide_name}</span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold dark:bg-zinc-800">{q.status}</span>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                {q.preferred_date} · {q.group_size} kişi · {q.preferred_language.toUpperCase()}
                {q.route_title ? ` · ${q.route_title}` : ''}
              </p>
              <p className="mt-2 text-sm">{q.message}</p>
              {q.guide_reply ? (
                <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm whitespace-pre-wrap">{q.guide_reply}</p>
              ) : null}
              {q.quoted_total != null ? (
                <p className="mt-2 font-bold text-primary">Toplam: ₺{q.quoted_total.toFixed(2)}</p>
              ) : null}

              {isGuide && q.status === 'pending' ? (
                <div className="mt-4 space-y-2">
                  {replyId === q.quote_id ? (
                    <form className="space-y-2" onSubmit={(e) => handleRespond(e, q.quote_id)}>
                      <textarea className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-zinc-950" rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Mesajınız" required />
                      <input className="w-full rounded-xl border px-3 py-2" type="number" min={1} placeholder="Toplam teklif (₺)" value={replyTotal || ''} onChange={(e) => setReplyTotal(Number(e.target.value))} required />
                      <div className="flex gap-2">
                        <button className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-white" type="submit">
                          Teklif gönder
                        </button>
                        <button className="rounded-xl border px-3 text-sm font-semibold" type="button" onClick={() => setReplyId(null)}>
                          İptal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-2">
                      <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white" type="button" onClick={() => { setReplyId(q.quote_id); setReplyText(''); setReplyTotal(q.group_size * 120); }}>
                        Fiyat teklifi ver
                      </button>
                      <button className="rounded-xl border px-4 py-2 text-sm font-semibold" type="button" onClick={(e) => handleRespond(e, q.quote_id, true)}>
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
