import type { FormEvent, ReactElement } from 'react';
import { useState } from 'react';

import { formatApiError } from '../../lib/api';
import { submitContentReport } from '../../services/report-service';
import { useAuthStore } from '../../stores/auth-store';

export function ContentReportForm({
  entityType,
  entityId,
}: {
  entityType: 'route' | 'place' | 'review' | 'guide';
  entityId: number;
}): ReactElement {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError('Bildirmek için giriş yapın.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitContentReport(accessToken, {
        entity_type: entityType,
        entity_id: entityId,
        reason: reason.trim(),
        details: details.trim(),
      });
      setMsg('Bildiriminiz alındı. Teşekkürler.');
      setOpen(false);
      setReason('');
      setDetails('');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (msg) {
    return <p className="text-xs text-primary">{msg}</p>;
  }

  if (!open) {
    return (
      <button type="button" className="text-xs font-semibold text-primary underline" onClick={() => setOpen(true)}>
        İçerik bildir
      </button>
    );
  }

  return (
    <form className="mt-3 space-y-2 rounded-xl border border-stone-900/10 p-3 dark:border-white/10" onSubmit={handleSubmit}>
      <p className="text-xs font-bold">İçerik bildirimi</p>
      <input
        className="theme-input w-full rounded-lg border px-2 py-1.5 text-sm"
        placeholder="Neden (ör. yanlış bilgi)"
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <textarea
        className="theme-input w-full rounded-lg border px-2 py-1.5 text-sm"
        placeholder="Açıklama (isteğe bağlı)"
        rows={2}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'Gönderiliyor…' : 'Gönder'}
        </button>
        <button type="button" className="text-xs font-semibold" onClick={() => setOpen(false)}>
          İptal
        </button>
      </div>
    </form>
  );
}
