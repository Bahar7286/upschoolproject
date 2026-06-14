import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { VerifiedGuideBadge } from '../components/guide/verified-guide-badge';
import { BackButton } from '../components/ui/back-button';
import { formatApiError } from '../lib/api';
import { useI18n } from '../lib/i18n';
import {
  getMyGuideVerification,
  submitGuideVerification,
  type GuideVerificationPayload,
} from '../services/guide-profile-service';
import { useAuthStore } from '../stores/auth-store';

export default function GuideVerificationPage(): ReactElement {
  const { t } = useI18n();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const licenseTypes = useMemo(
    () =>
      [
        { id: 'regional' as const, label: t('guideVerify.licenseRegional') },
        { id: 'national' as const, label: t('guideVerify.licenseNational') },
        { id: 'professional' as const, label: t('guideVerify.licenseProfessional') },
      ],
    [t],
  );

  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyGuideVerification>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [docUploading, setDocUploading] = useState(false);

  const [form, setForm] = useState<GuideVerificationPayload>({
    license_number: '',
    license_type: 'regional',
    university: '',
    department: '',
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
    setForm((prev) => ({
      ...prev,
      department: prev.department || t('guideVerify.departmentDefault'),
    }));
  }, [t]);

  useEffect(() => {
    if (!accessToken) return;
    getMyGuideVerification(accessToken).then(setProfile).catch(() => undefined);
  }, [accessToken]);

  if (user?.role !== 'guide') {
    return (
      <p className="text-sm">
        {t('guideVerify.guideOnly')}{' '}
        <Link className="font-bold text-primary" to="/register">
          {t('guideVerify.guideSignup')}
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
        <h1 className="font-display text-2xl font-bold">{t('guideVerify.verifiedTitle')}</h1>
        <p className="text-sm text-stone-600">{t('guideVerify.verifiedBody')}</p>
        <button className="rounded-xl bg-primary px-6 py-3 font-bold text-white" type="button" onClick={() => navigate('/guide')}>
          {t('guideVerify.goToPanel')}
        </button>
      </section>
    );
  }

  if (profile?.verification_status === 'under_review') {
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-[22px] border border-amber-400/40 bg-amber-50 p-6 dark:bg-amber-950/30">
        <h1 className="font-display text-xl font-bold">{t('guideVerify.underReviewTitle')}</h1>
        <p className="text-sm text-stone-700 dark:text-stone-300">{t('guideVerify.underReviewBody')}</p>
        <p className="text-xs text-stone-500">{t('guideVerify.badgeNo', { no: profile.license_number })}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <BackButton to="/guide" />
      <header>
        <h1 className="font-display text-3xl font-extrabold">{t('guideVerify.title')}</h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{t('guideVerify.intro')}</p>
        <Link
          className="mt-2 inline-block text-sm font-bold text-primary underline"
          to="https://www.ktb.gov.tr"
          target="_blank"
          rel="noreferrer"
        >
          {t('guideVerify.ministryLink')}
        </Link>
      </header>

      <form className="space-y-4 rounded-[22px] border border-stone-900/10 bg-white/90 p-5 dark:border-white/10 dark:bg-zinc-900/95" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            {t('guideVerify.licenseNumber')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" required value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">
            {t('guideVerify.licenseType')}
            <select className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value as GuideVerificationPayload['license_type'] })}>
              {licenseTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            {t('guideVerify.graduationYear')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" type="number" value={form.graduation_year ?? ''} onChange={(e) => setForm({ ...form, graduation_year: Number(e.target.value) })} />
          </label>
          <label className="text-sm font-semibold">
            {t('guideVerify.university')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" required value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">
            {t('guideVerify.department')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          {t('guideVerify.documentUpload')}
          <input
            accept=".pdf,image/jpeg,image/png"
            className="mt-1 w-full rounded-xl border border-stone-900/15 px-3 py-2 text-[15px] file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-semibold dark:border-white/15 dark:bg-zinc-950"
            type="file"
          />
          <span className="mt-1 block text-xs text-stone-500">{t('guideVerify.fileHint')}</span>
        </label>
        <label className="block text-sm font-semibold">
          {t('guideVerify.documentSummary')}
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" rows={3} required minLength={20} value={form.document_summary} onChange={(e) => setForm({ ...form, document_summary: e.target.value })} placeholder={t('guideVerify.documentSummaryPlaceholder')} />
        </label>
        <label className="block text-sm font-semibold">
          {t('guideVerify.bioLabel')}
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-zinc-950" rows={3} required minLength={20} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            {t('guideVerify.minGroup')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min={1} value={form.min_group_size} onChange={(e) => setForm({ ...form, min_group_size: Number(e.target.value) })} />
          </label>
          <label className="text-sm font-semibold">
            {t('guideVerify.maxGroup')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min={1} value={form.max_group_size} onChange={(e) => setForm({ ...form, max_group_size: Number(e.target.value) })} />
          </label>
          <label className="text-sm font-semibold">
            {t('guideVerify.pricePerPerson')}
            <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min={0} value={form.base_price_per_person} onChange={(e) => setForm({ ...form, base_price_per_person: Number(e.target.value) })} />
          </label>
        </div>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
        <button className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-60" type="submit" disabled={busy || docUploading}>
          {busy || docUploading ? t('guideVerify.submitting') : t('guideVerify.submitApplication')}
        </button>
      </form>
    </section>
  );
}
