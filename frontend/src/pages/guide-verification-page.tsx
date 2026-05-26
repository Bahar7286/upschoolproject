import type { FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { VerifiedGuideBadge } from '../components/guide/verified-guide-badge';
import { formatApiError } from '../lib/api';
import {
  getMyGuideVerification,
  submitGuideVerification,
  uploadVerificationDocument,
  type GuideVerificationPayload,
} from '../services/guide-profile-service';
import { useAuthStore } from '../stores/auth-store';

const LICENSE_TYPES = [
  { id: 'regional', label: 'Bölgesel' },
  { id: 'national', label: 'Ülkesel' },
  { id: 'professional', label: 'Profesyonel (eski düzen)' },
] as const;

export default function GuideVerificationPage(): ReactElement {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyGuideVerification>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  const [form, setForm] = useState<GuideVerificationPayload>({
    license_number: '',
    license_type: 'regional',
    university: '',
    department: 'Turist Rehberliği',
    graduation_year: 2020,
    languages: ['tr', 'en'],
    regions: ['Istanbul'],
    document_summary: '',
    bio: '',
    specialties: ['history'],
    min_group_size: 1,
    max_group_size: 15,
    base_price_per_person: 100,
  });

  useEffect(() => {
    if (!accessToken) return;
    getMyGuideVerification(accessToken).then(setProfile).catch(() => undefined);
  }, [accessToken]);

  if (user?.role !== 'guide') {
    return (
      <p className="text-sm">
        Bu sayfa yalnızca rehber hesapları içindir.{' '}
        <Link className="font-bold text-primary" to="/register">
          Rehber kaydı
        </Link>
      </p>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setError('');
    try {
      const saved = await submitGuideVerification(accessToken, form);
      setProfile(saved);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
      setDocUploading(false);
    }
  };

  if (profile?.is_verified) {
    return (
      <section className="mx-auto max-w-lg space-y-4 text-center">
        <VerifiedGuideBadge />
        <h1 className="font-display text-2xl font-bold">Hesabınız onaylı</h1>
        <p className="text-sm text-stone-600">Turistler sizi rehber listesinde görebilir.</p>
        <button className="rounded-xl bg-primary px-6 py-3 font-bold text-white" type="button" onClick={() => navigate('/guide')}>
          Panele git
        </button>
      </section>
    );
  }

  if (profile?.verification_status === 'under_review') {
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-[22px] border border-amber-400/40 bg-amber-50 p-6 dark:bg-amber-950/30">
        <h1 className="font-display text-xl font-bold">İnceleme sürecinde</h1>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          Belgeleriniz platform ekibi tarafından kontrol ediliyor. Onay sonrası profiliniz yayına alınır.
        </p>
        <p className="text-xs text-stone-500">Kokart no: {profile.license_number}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Rehber doğrulama</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          6326 sayılı Turist Rehberliği Meslek Kanunu kapsamında kokart / ruhsat bilgilerinizi girin. Herkes rehber
          olamaz — yalnızca doğrulanan hesaplar turiste listelenir.
        </p>
        <Link
          className="mt-2 inline-block text-sm font-bold text-primary underline"
          to="https://www.ktb.gov.tr"
          target="_blank"
          rel="noreferrer"
        >
          Kültür ve Turizm Bakanlığı — turist rehberliği mevzuatı
        </Link>
      </header>

      <form className="space-y-4 rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            Kokart / ruhsat numarası
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" required value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">
            Ruhsat türü
            <select className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value as GuideVerificationPayload['license_type'] })}>
              {LICENSE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Mezuniyet yılı
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" type="number" value={form.graduation_year ?? ''} onChange={(e) => setForm({ ...form, graduation_year: Number(e.target.value) })} />
          </label>
          <label className="text-sm font-semibold">
            Üniversite
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" required value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">
            Bölüm
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Kokart / ruhsat belgesi (PDF veya fotoğraf)
          <input
            accept=".pdf,image/jpeg,image/png"
            className="mt-1 w-full rounded-xl border border-stone-900/15 px-3 py-2 text-[15px] file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-semibold dark:border-white/15 dark:bg-zinc-950"
            type="file"
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
          />
          <span className="mt-1 block text-xs text-stone-500">Maks. 8 MB · PDF, JPG veya PNG</span>
        </label>
        <label className="block text-sm font-semibold">
          Belge özeti (ruhsatname, çalışma kartı, diploma)
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" rows={3} required minLength={20} value={form.document_summary} onChange={(e) => setForm({ ...form, document_summary: e.target.value })} placeholder="Belge türü, veren kurum, geçerlilik…" />
        </label>
        <label className="block text-sm font-semibold">
          Tanıtım / bio
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" rows={3} required minLength={20} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Min grup
            <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min={1} value={form.min_group_size} onChange={(e) => setForm({ ...form, min_group_size: Number(e.target.value) })} />
          </label>
          <label className="text-sm font-semibold">
            Max grup
            <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min={1} value={form.max_group_size} onChange={(e) => setForm({ ...form, max_group_size: Number(e.target.value) })} />
          </label>
          <label className="text-sm font-semibold">
            Kişi başı başlangıç (₺)
            <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min={0} value={form.base_price_per_person} onChange={(e) => setForm({ ...form, base_price_per_person: Number(e.target.value) })} />
          </label>
        </div>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
        <button className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-60" type="submit" disabled={busy || docUploading}>
          {busy || docUploading ? 'Gönderiliyor…' : 'Doğrulama başvurusu gönder'}
        </button>
      </form>
    </section>
  );
}
