import { Lock, MessageSquare, Star, StickyNote } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState } from '../ui/empty-state';
import { ErrorAlert } from '../ui/error-alert';
import { Button } from '../ui/button';
import { useEmptyStates } from '../../hooks/use-empty-states';
import { mapError } from '../../lib/user-errors';
import {
  createRouteReview,
  deleteMyRouteNote,
  deleteRouteReview,
  getMyRouteNote,
  getRouteReviewSummary,
  listRouteReviews,
  saveMyRouteNote,
} from '../../services/social-service';
import { useAuthStore } from '../../stores/auth-store';
import type { NoteResponse, ReviewResponse, ReviewSummary } from '../../types/social';

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }): ReactElement {
  return (
    <div className="inline-flex gap-1" role={onChange ? 'radiogroup' : undefined} aria-label="Puan">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          className={onChange ? 'tap-scale focus-ring' : 'pointer-events-none'}
          key={n}
          type="button"
          aria-label={`${n} yıldız`}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

export function RouteNotesPanel({ routeId }: { routeId: number }): ReactElement {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [note, setNote] = useState<NoteResponse | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const n = await getMyRouteNote(routeId, accessToken);
        if (!cancelled) {
          setNote(n);
          setDraft(n?.content ?? '');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, routeId]);

  const handleSave = async () => {
    if (!accessToken) {
      navigate('/login', { state: { from: `/routes/${routeId}` } });
      return;
    }
    if (!draft.trim()) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const saved = await saveMyRouteNote(routeId, draft.trim(), accessToken);
      setNote(saved);
      setSuccess('Kişisel not kaydedildi. Yalnızca siz görebilirsiniz.');
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken) return;
    setBusy(true);
    try {
      await deleteMyRouteNote(routeId, accessToken);
      setNote(null);
      setDraft('');
      setSuccess('Not silindi.');
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95"
      aria-labelledby="notes-title"
    >
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold" id="notes-title">
        <StickyNote className="h-5 w-5 text-amber-600" aria-hidden="true" />
        Kişisel notlarım
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/5 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:bg-white/10 dark:text-stone-400">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Gizli
        </span>
      </h2>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Bu notları yalnızca {user?.full_name ?? 'siz'} görebilirsiniz.
      </p>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary" role="status">
          {success}
        </p>
      ) : null}

      <textarea
        className="mt-4 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
        rows={4}
        value={draft}
        placeholder={accessToken ? 'Bu rota hakkında kişisel notlarınız…' : 'Not almak için giriş yapın.'}
        disabled={!accessToken || busy}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy || !draft.trim()} type="button" onClick={handleSave}>
          {busy ? 'Kaydediliyor…' : note ? 'Notu güncelle' : 'Notu kaydet'}
        </Button>
        {note ? (
          <Button disabled={busy} type="button" variant="secondary" onClick={handleDelete}>
            Sil
          </Button>
        ) : null}
        {!accessToken ? (
          <Link className="tap-scale inline-flex min-h-[48px] items-center text-sm font-semibold text-primary underline" to="/login">
            Giriş yap
          </Link>
        ) : null}
      </div>
      {note ? (
        <p className="mt-2 text-xs text-stone-500">Son güncelleme: {new Date(note.updated_at).toLocaleString('tr-TR')}</p>
      ) : null}
    </section>
  );
}

export function RouteReviewsPanel({ routeId }: { routeId: number }): ReactElement {
  const emptyStates = useEmptyStates();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const myReview = reviews.find((r) => r.user_id === user?.user_id);

  const load = async () => {
    const [list, sum] = await Promise.all([listRouteReviews(routeId), getRouteReviewSummary(routeId)]);
    setReviews(list);
    setSummary(sum);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, sum] = await Promise.all([listRouteReviews(routeId), getRouteReviewSummary(routeId)]);
        if (!cancelled) {
          setReviews(list);
          setSummary(sum);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      navigate('/login', { state: { from: `/routes/${routeId}` } });
      return;
    }
    if (myReview) {
      setError('Bu rota için zaten yorum yaptınız.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await createRouteReview(routeId, { rating, comment: comment.trim() }, accessToken);
      setComment('');
      setSuccess('Yorumunuz yayınlandı.');
      await load();
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteMine = async () => {
    if (!accessToken || !myReview) return;
    setBusy(true);
    try {
      await deleteRouteReview(routeId, myReview.review_id, accessToken);
      setSuccess('Yorumunuz silindi.');
      await load();
    } catch (err) {
      setError(mapError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95"
      aria-labelledby="reviews-title"
    >
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold" id="reviews-title">
        <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
        Gezgin yorumları
      </h2>
      {summary ? (
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          <Stars value={Math.round(summary.average_rating)} /> {summary.average_rating}/5 · {summary.review_count} yorum
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark dark:text-primary" role="status">
          {success}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {reviews.map((r) => (
          <li className="rounded-xl border border-stone-900/10 p-4 dark:border-white/10" key={r.review_id}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold">{r.author_name}</p>
              <Stars value={r.rating} />
            </div>
            <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{r.comment}</p>
            <p className="mt-2 text-xs text-stone-500">{new Date(r.created_at).toLocaleDateString('tr-TR')}</p>
          </li>
        ))}
        {reviews.length === 0 ? (
          <li>
            <EmptyState
              {...emptyStates.reviews}
              actionTo={`/routes/${routeId}`}
            />
          </li>
        ) : null}
      </ul>

      {!myReview ? (
        <form className="mt-5 border-t border-stone-900/10 pt-5 dark:border-white/10" onSubmit={handleSubmit}>
          <p className="font-semibold">Yorum yaz</p>
          <div className="mt-2">
            <Stars value={rating} onChange={setRating} />
          </div>
          <textarea
            className="mt-3 w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2.5 dark:border-white/15 dark:bg-zinc-950"
            rows={3}
            required
            minLength={3}
            value={comment}
            placeholder={accessToken ? 'Deneyiminizi paylaşın…' : 'Yorum yapmak için giriş yapın.'}
            disabled={!accessToken || busy}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button className="mt-3" disabled={busy || !accessToken} type="submit">
            {busy ? 'Gönderiliyor…' : 'Yorumu yayınla'}
          </Button>
        </form>
      ) : (
        <div className="mt-5 border-t border-stone-900/10 pt-5 dark:border-white/10">
          <p className="text-sm text-stone-600 dark:text-stone-400">Bu rota için yorumunuz yayında.</p>
          <Button className="mt-2" disabled={busy} type="button" variant="secondary" onClick={handleDeleteMine}>
            Yorumumu sil
          </Button>
        </div>
      )}
    </section>
  );
}
