import {
  Award,
  BookOpen,
  Crown,
  Flame,
  History,
  LogOut,
  Palette,
  Settings,
  Trophy,
  Zap,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { formatApiError } from '../lib/api';
import { LanguageSwitcher, useI18n } from '../lib/i18n';
import { FONT_META, THEME_META } from '../lib/theme-meta';
import { fetchGamification, redeemReward, updatePreferences } from '../services/profile-service';
import { saveMyRouteNote } from '../services/social-service';
import { useBadgeLabels } from '../hooks/use-badge-labels';
import { useFontLabels, useThemeLabels } from '../hooks/use-theme-labels';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { ErrorAlert } from '../components/ui/error-alert';
import { SiteFooter } from '../components/legal/site-footer';
import { ProfileQuickLinks } from '../components/profile/profile-quick-links';
import { ThemePreviewCard } from '../components/theme/theme-preview-card';
import { useProfileData, useProfileTabs, ProfileTabsNav, EmptyHint, HistoryRow, SectionTitle, StatCard } from '../features/profile';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import {
  useThemeStore,
  type FontPreference,
  type ThemePreference,
} from '../stores/theme-store';
import type { RewardItem } from '../types/user';

const ALL_BADGES = ['welcome', 'first_step', 'route_explorer', 'streak_3', 'streak_7'] as const;

export default function ProfilePage(): ReactElement {
  const { t, locale } = useI18n();
  const themeLabels = useThemeLabels();
  const fontLabels = useFontLabels();
  const badgeLabels = useBadgeLabels();
  const TABS = [
    { id: 'overview' as const, label: t('profile.tabs.overview', 'Özet'), icon: Award },
    { id: 'history' as const, label: t('profile.tabs.history', 'Geçmiş'), icon: History },
    { id: 'notes' as const, label: t('profile.tabs.notes', 'Notlarım'), icon: BookOpen },
    { id: 'play' as const, label: t('profile.tabs.play', 'Oyun'), icon: Trophy },
    { id: 'look' as const, label: t('profile.tabs.look', 'Görünüm'), icon: Palette },
  ];
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const interests = useOnboardingStore((s) => s.interests);
  const setInterests = useOnboardingStore((s) => s.setInterests);
  const themePreference = useThemeStore((s) => s.preference);
  const fontPreference = useThemeStore((s) => s.font);
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const setFontPreference = useThemeStore((s) => s.setFont);

  const { data: routes = [] } = useRoutesQuery();
  const routeById = useMemo(() => new Map(routes.map((r) => [r.route_id, r])), [routes]);

  const { tab, setTab } = useProfileTabs();
  const {
    stats,
    setStats,
    leaderboard,
    plans,
    notes,
    setNotes,
    error,
    setError,
  } = useProfileData(accessToken, user?.user_id);
  const [noteRouteId, setNoteRouteId] = useState<number>(0);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');
  const [saved, setSaved] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [redeemBusy, setRedeemBusy] = useState('');

  useEffect(() => {
    if (user?.interests?.length) setInterests(user.interests);
    if (user?.theme_preference) {
      setThemePreference(user.theme_preference as ThemePreference);
    }
  }, [user, setInterests, setThemePreference]);

  const handleSaveTheme = async (theme: ThemePreference, font?: FontPreference) => {
    setThemePreference(theme);
    if (font) setFontPreference(font);
    if (!accessToken) return;
    try {
      const updated = await updatePreferences(accessToken, {
        interests: interests.length ? interests : user?.interests ?? [],
        duration_minutes: user?.duration_minutes ?? 120,
        budget: user?.budget ?? 150,
        theme_preference: theme,
        preferred_language: user?.preferred_language ?? 'tr',
        preferred_city: user?.preferred_city ?? useOnboardingStore.getState().preferredCity,
        onboarding_completed: user?.onboarding_completed ?? true,
      });
      setUser(updated);
      setSaved(t('profile.lookSaved', 'Görünüm kaydedildi.'));
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const xp = stats?.xp ?? user?.xp ?? 0;
  const streak = stats?.streak_days ?? user?.streak_days ?? 0;
  const levelName = stats?.level_name ?? t('profile.traveler', 'Gezgin');
  const nextXp = stats?.next_level_xp ?? 200;
  const badges = stats?.badges ?? user?.badges ?? [];
  const xpRules = stats?.xp_rules ?? [];
  const rewards = stats?.rewards ?? [];
  const redeemedRewards = stats?.redeemed_rewards ?? [];
  const rankRaw = leaderboard?.your_rank ?? stats?.weekly_rank;
  const rank = rankRaw != null && Number.isFinite(rankRaw) ? rankRaw : null;
  const boardEntries = leaderboard?.entries ?? [];
  const viewerOnBoard = user ? boardEntries.some((e) => e.user_id === user.user_id) : false;
  const xpPct = Math.min(100, Math.round((xp / nextXp) * 100));

  const completedPlans = plans.filter((p) => p.status === 'completed');
  const upcomingPlans = plans.filter((p) => p.status !== 'completed');

  const initials =
    user?.full_name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'HG';

  return (
    <section className="mx-auto w-full min-w-0 max-w-3xl space-y-5" aria-labelledby="prof-title">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-theme sm:text-3xl" id="prof-title">
          {t('profile.title', 'Profil')}
        </h1>
        <p className="mt-1 text-sm text-theme-muted">{t('profile.tabsHint', 'Sekmelere tıklayarak bölümlere geçin')}</p>
      </header>

      {error ? (
        <ErrorAlert error={{ kind: 'api', message: error, actionLabel: t('common.goDiscover', 'Keşfe dön'), actionTo: '/discover' }} />
      ) : null}
      {saved ? (
        <p className="alert-success rounded-xl px-3 py-2 text-sm font-semibold" role="status">
          {saved}
        </p>
      ) : null}

      <ProfileTabsNav
        tabs={TABS}
        active={tab}
        onSelect={setTab}
        ariaLabel={t('profile.tabsAria', 'Profil sekmeleri')}
      />

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="theme-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl font-bold text-theme">{user?.full_name}</h2>
              <p className="truncate text-sm text-theme-muted">{user?.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="badge-pill inline-block rounded-full px-2 py-0.5 text-xs font-bold">
                  {user?.role === 'guide' ? t('profile.guide', 'Rehber') : t('profile.tourist', 'Turist')}
                </span>
                {user?.is_premium ? (
                  <span className="badge-pill inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-100">
                    <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                    Premium
                  </span>
                ) : (
                  <Link className="inline-flex text-xs font-bold text-primary underline" to="/premium">
                    {t('profile.goPremium', "Premium'a geç")}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <ProfileQuickLinks />
          <div className="theme-card space-y-3 p-5" id="settings">
            <h2 className="font-display text-lg font-bold text-theme">{t('profile.preferences', 'Tercihler')}</h2>
            <p className="text-sm text-theme-muted">{t('profile.preferencesHint', 'Dil ve bildirim tercihleri')}</p>
            <LanguageSwitcher />
            <p className="text-xs text-theme-muted">
              {locale === 'en' ? (
                <>
                  For theme and font, open the{' '}
                  <button type="button" className="font-bold text-primary underline" onClick={() => setTab('look')}>
                    {t('profile.lookTabLink', 'Appearance')}
                  </button>{' '}
                  tab.
                </>
              ) : (
                <>
                  Tema ve font için{' '}
                  <button type="button" className="font-bold text-primary underline" onClick={() => setTab('look')}>
                    {t('profile.lookTabLink', 'Görünüm')}
                  </button>{' '}
                  sekmesine geçin.
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard icon={Zap} value={String(xp)} label="XP" />
            <StatCard icon={Flame} value={String(streak)} label="Streak" />
            <StatCard icon={Award} value={rank != null ? `#${rank}` : '—'} label={t('profile.weekly', 'Haftalık')} />
          </div>
          <div className="theme-card p-5">
            <div className="flex justify-between text-sm font-semibold text-theme">
              <span>{levelName}</span>
              <span className="text-theme-muted">
                {xp} / {nextXp} XP
              </span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full"
              style={{ background: 'color-mix(in srgb, var(--hg-border) 80%, transparent)' }}
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-4">
          <SectionTitle title={t('profile.completedRoutes', 'Tamamlanan rotalar')} />
          {completedPlans.length === 0 ? (
            <EmptyHint
              text={t('profile.noCompletedTrips', 'Henüz tamamlanan gezi yok.')}
              link="/discover"
              linkLabel={t('profile.createPersonalRoute', 'Kişisel rotanı oluştur')}
            />
          ) : (
            <ul className="space-y-2">
              {completedPlans.map((plan) => (
                <HistoryRow
                  key={plan.plan_id}
                  title={plan.title}
                  subtitle={plan.planned_date}
                  routeId={plan.route_id}
                  routeTitle={plan.route_id != null ? routeById.get(plan.route_id)?.title : undefined}
                />
              ))}
            </ul>
          )}
          <SectionTitle title={t('profile.plannedTrips', 'Planlanan geziler')} />
          {upcomingPlans.length === 0 ? (
            <EmptyHint text={t('profile.noPlans', 'Takvimde plan yok.')} link="/planner" linkLabel={t('common.createPlan', 'Plan oluştur')} />
          ) : (
            <ul className="space-y-2">
              {upcomingPlans.map((plan) => (
                <HistoryRow
                  key={plan.plan_id}
                  title={plan.title}
                  subtitle={`${plan.planned_date} · ${plan.status}`}
                  routeId={plan.route_id}
                  routeTitle={plan.route_id != null ? routeById.get(plan.route_id)?.title : undefined}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'notes' ? (
        <div className="space-y-3">
          <SectionTitle title={t('profile.notesTitle', 'Kişisel rota notları')} />
          <div className="theme-card space-y-3 p-4">
            <p className="text-sm font-semibold text-theme">{t('profile.notesAdd', 'Not ekle')}</p>
            <select
              className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
              value={noteRouteId}
              onChange={(e) => setNoteRouteId(Number(e.target.value))}
            >
              <option value={0}>{t('profile.notesPickRoute', 'Rota seç')}</option>
              {routes.map((r) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.title}
                </option>
              ))}
            </select>
            <textarea
              className="w-full rounded-xl border border-stone-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
              rows={4}
              placeholder={t('profile.notesPlaceholder', 'Gezi notunuz…')}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            {noteMsg ? (
              <p className="text-sm font-semibold text-primary" role="status">
                {noteMsg}
              </p>
            ) : null}
            <button
              type="button"
              className="tap-scale rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              disabled={!accessToken || noteBusy || !noteRouteId || !noteDraft.trim()}
              onClick={async () => {
                if (!accessToken || !noteRouteId) return;
                setNoteBusy(true);
                setNoteMsg('');
                try {
                  const saved = await saveMyRouteNote(noteRouteId, noteDraft.trim(), accessToken);
                  setNotes((prev) => {
                    const rest = prev.filter((n) => n.route_id !== saved.route_id);
                    return [saved, ...rest];
                  });
                  setNoteDraft('');
                  setNoteMsg(t('profile.notesSaved', 'Not kaydedildi'));
                } catch (err) {
                  setError(formatApiError(err));
                } finally {
                  setNoteBusy(false);
                }
              }}
            >
              {noteBusy ? '…' : t('profile.notesSave', 'Kaydet')}
            </button>
          </div>
          {notes.length === 0 ? (
            <EmptyHint text={t('profile.notesEmpty', 'Henüz not yok. Aşağıdan yeni not ekleyebilir veya rota detayından kaydedebilirsin.')} link="/discover" linkLabel={t('profile.notesPickRoute', 'Rota seç')} />
          ) : (
            notes.map((note) => (
              <div key={note.note_id} className="theme-card p-4">
                <Link className="font-bold text-primary hover:underline" to={`/routes/${note.route_id}`}>
                  {routeById.get(note.route_id)?.title ?? `Rota #${note.route_id}`}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-theme">{note.content}</p>
                <p className="mt-2 text-xs text-theme-muted">
                  {t('profile.notesUpdated', 'Güncellendi')}:{' '}
                  {new Date(note.updated_at).toLocaleString(locale === 'en' ? 'en-GB' : 'tr-TR')}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'play' ? (
        <div className="space-y-5">
          <div className="theme-card rounded-[22px] border p-5">
            <h2 className="font-display text-lg font-bold text-theme">{t('profile.xpHowTitle', 'Kültür puanı (XP) nasıl kazanılır?')}</h2>
            <p className="mt-1 text-sm text-theme-muted">
              {t('profile.xpHowDesc', 'XP hem seviye hem mağaza parasıdır. Aşağıdaki aksiyonlar otomatik işlenir.')}
            </p>
            <ul className="mt-4 space-y-2">
              {(xpRules.length ? xpRules : [{ id: 'welcome', title: t('profile.welcomeXp', 'Hoş geldin'), description: t('profile.registrationXp', 'Kayıt'), xp: 100 }]).map(
                (rule) => (
                  <li
                    key={rule.id}
                    className="list-row flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1">
                      <strong className="text-theme">{rule.title}</strong>
                      <span className="block text-xs text-theme-muted">{rule.description}</span>
                    </span>
                    <span className="shrink-0 font-bold text-primary">+{rule.xp} XP</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <SectionTitle title={t('profile.rewardShop', 'Ödül mağazası (XP harca)')} />
          <p className="text-sm text-theme-muted">
            {t('profile.rewardShopDesc', 'Kupon ve indirimler ödeme ekranında kod ile uygulanır. Sahip olduğunuz ödüller profilde listelenir.')}
          </p>
          {redeemMsg ? (
            <p className="alert-success rounded-xl px-3 py-2 text-sm font-semibold" role="status">
              {redeemMsg}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {rewards.map((reward: RewardItem) => (
              <div
                key={reward.id}
                className={`theme-card rounded-[18px] border p-4 ${reward.owned ? 'opacity-70' : ''}`}
              >
                <div className="flex justify-between gap-2">
                  <h3 className="min-w-0 flex-1 font-bold text-theme">{reward.title}</h3>
                  <span className="badge-pill shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
                    {reward.value_label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-theme-muted">{reward.description}</p>
                <p className="mt-2 text-sm font-bold text-primary">{reward.cost_xp} XP</p>
                {reward.owned ? (
                  <p className="mt-2 text-xs font-semibold text-theme-muted">{t('profile.rewardActive', 'Aktif · ödeme kodunuz profilde')}</p>
                ) : (
                  <button
                    className="tap-scale mt-3 w-full rounded-xl bg-primary py-2 text-sm font-bold disabled:opacity-50"
                    disabled={xp < reward.cost_xp || redeemBusy === reward.id}
                    type="button"
                    onClick={async () => {
                      if (!accessToken) return;
                      setRedeemBusy(reward.id);
                      setRedeemMsg('');
                      try {
                        const res = await redeemReward(accessToken, reward.id);
                        setRedeemMsg(res.message);
                        const gam = await fetchGamification(accessToken);
                        setStats(gam);
                      } catch (err) {
                        setError(formatApiError(err));
                      } finally {
                        setRedeemBusy('');
                      }
                    }}
                  >
                    {redeemBusy === reward.id ? '…' : t('profile.redeem', 'Kullan')}
                  </button>
                )}
              </div>
            ))}
          </div>
          {redeemedRewards.length > 0 ? (
            <p className="text-xs text-theme-muted">
              {t('profile.activeCodes', 'Aktif kodlar:')} {redeemedRewards.map((id) => `HG-${id.toUpperCase()}`).join(', ')}
            </p>
          ) : null}

          <SectionTitle title={t('profile.badges', 'Rozetler')} />
          <div className="flex flex-wrap gap-3">
            {ALL_BADGES.map((id) => {
              const earned = badges.includes(id);
              return (
                <div
                  key={id}
                  className={`theme-card flex flex-col items-center gap-1 p-3 ${
                    earned ? 'ring-2 ring-[var(--hg-accent)]' : 'opacity-45 grayscale'
                  }`}
                >
                  <Award className="h-8 w-8 text-primary" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-theme">{badgeLabels[id] ?? id}</span>
                </div>
              );
            })}
          </div>
          <SectionTitle title={t('profile.weeklyCompetition', 'Haftalık yarışma')} />
          <p className="text-sm text-theme-muted">
            {rank != null ? (
              <>
                {t('profile.weeklyRank', { rank }, 'Bu hafta #{rank} sıradasın.')}
              </>
            ) : (
              t('profile.leaderboardLoading', 'Liderlik tablosu yükleniyor…')
            )}{' '}
            {t('profile.leaderboardHint', 'En çok XP kazanan gezginler ödül rozeti alır.')}
          </p>
          <ol className="theme-card space-y-2 p-4">
            {boardEntries.length === 0 ? (
              <li className="list-row rounded-xl px-3 py-2 text-sm text-theme-muted">{t('profile.noLeaderboard', 'Henüz sıralama verisi yok.')}</li>
            ) : (
              boardEntries.map((entry) => {
                const isYou = user?.user_id === entry.user_id;
                return (
                  <li
                    key={entry.user_id}
                    className={`list-row flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
                      entry.rank <= 3 ? 'font-bold ring-1 ring-[var(--hg-primary)]' : ''
                    } ${isYou ? 'border-2 border-[var(--hg-primary)]' : ''}`}
                  >
                    <span className="min-w-0 flex-1 truncate text-theme">
                      #{entry.rank} {entry.full_name}
                      {isYou ? ` (${t('common.you', 'Sen')})` : ''}
                    </span>
                    <span className="shrink-0 font-bold text-primary">{entry.xp} XP</span>
                  </li>
                );
              })
            )}
            {user && rank != null && !viewerOnBoard ? (
              <li className="list-row flex items-center justify-between rounded-xl border-2 border-[var(--hg-primary)] px-3 py-2 text-sm font-bold">
                <span className="text-theme">#{rank} {t('common.you', 'Sen')}</span>
                <span className="text-primary">{xp} XP</span>
              </li>
            ) : null}
          </ol>
        </div>
      ) : null}

      {tab === 'look' ? (
        <div className="theme-card space-y-6 p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-theme">
            <Settings className="h-5 w-5" aria-hidden="true" />
            {t('profile.lookCustomize', 'Görünüm özelleştirme')}
          </h2>
          <p className="text-sm text-theme-muted">
            {t('profile.lookCustomizeDesc', 'Her tema farklı bir İstanbul hikâyesi anlatır: arka plan, menü, kartlar, buton ve font birlikte değişir. Seçim anında uygulanır.')}
          </p>
          <div>
            <p className="mb-3 text-sm font-bold text-theme">{t('profile.pickTheme', 'Tema seçin')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEME_META.map((meta) => (
                <ThemePreviewCard
                  key={meta.id}
                  label={themeLabels[meta.id]}
                  meta={meta}
                  selected={themePreference === meta.id}
                  onSelect={() => handleSaveTheme(meta.id)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-theme">{t('profile.pickFont', 'Yazı tipi')}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(Object.keys(fontLabels) as FontPreference[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`font-option tap-scale rounded-xl px-4 py-2.5 text-left text-sm font-semibold ${
                    fontPreference === f ? 'font-option--active' : ''
                  }`}
                  onClick={() => {
                    setFontPreference(f);
                    void handleSaveTheme(themePreference, f);
                  }}
                >
                  <span className="block font-bold">{fontLabels[f]}</span>
                  <span className="font-option-sub block text-xs">{FONT_META[f]}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            className="tap-scale inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--hg-border)] font-semibold text-theme hover:border-red-500 hover:text-red-600"
            type="button"
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('profile.logoutBtn', 'Çıkış yap')}
          </button>
        </div>
      ) : null}

      <SiteFooter className="mt-10" />
    </section>
  );
}
