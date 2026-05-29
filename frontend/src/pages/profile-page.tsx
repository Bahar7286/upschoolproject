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
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { formatApiError } from '../lib/api';
import { listPlans } from '../services/plan-service';
import { listPurchasesByUser } from '../services/purchase-service';
import { fetchGamification, fetchLeaderboard, redeemReward, updatePreferences } from '../services/profile-service';
import type { LeaderboardResponse } from '../types/user';
import type { RewardItem } from '../types/user';
import { listMyNotes } from '../services/social-service';
import { useRoutesQuery } from '../hooks/use-routes-query';
import { useAuthStore } from '../stores/auth-store';
import { useOnboardingStore } from '../stores/onboarding-store';
import type { GamificationResponse } from '../types/user';
import { BADGE_LABELS } from '../types/user';
import type { NoteResponse } from '../types/social';
import type { PlanResponse } from '../types/plan';
import { LanguageSwitcher, useI18n } from '../lib/i18n';
import { ProfileQuickLinks } from '../components/profile/profile-quick-links';
import { SiteFooter } from '../components/legal/site-footer';
import { ErrorAlert } from '../components/ui/error-alert';
import { mapError } from '../lib/user-errors';
import { ThemePreviewCard } from '../components/theme/theme-preview-card';
import { FONT_META, THEME_META } from '../lib/theme-meta';
import {
  FONT_LABELS,
  THEME_LABELS,
  useThemeStore,
  type FontPreference,
  type ThemePreference,
} from '../stores/theme-store';

const ALL_BADGES = ['welcome', 'first_step', 'route_explorer', 'streak_3', 'streak_7'] as const;

type Tab = 'overview' | 'history' | 'notes' | 'play' | 'look';

export default function ProfilePage(): ReactElement {
  const { t, locale } = useI18n();
  const TABS: { id: Tab; label: string; icon: typeof Award }[] = [
    { id: 'overview', label: t('profile.tabs.overview', 'Özet'), icon: Award },
    { id: 'history', label: t('profile.tabs.history', 'Geçmiş'), icon: History },
    { id: 'notes', label: t('profile.tabs.notes', 'Notlarım'), icon: BookOpen },
    { id: 'play', label: t('profile.tabs.play', 'Oyun'), icon: Trophy },
    { id: 'look', label: t('profile.tabs.look', 'Görünüm'), icon: Palette },
  ];
  const navigate = useNavigate();
  const location = useLocation();
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

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<GamificationResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [redeemMsg, setRedeemMsg] = useState('');
  const [redeemBusy, setRedeemBusy] = useState('');

  useEffect(() => {
    if (!accessToken || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [gam, planList, noteList, board] = await Promise.all([
          fetchGamification(accessToken),
          listPlans(accessToken),
          listMyNotes(accessToken),
          fetchLeaderboard(accessToken),
        ]);
        if (!cancelled) {
          setStats(gam);
          setPlans(planList);
          setNotes(noteList);
          setLeaderboard(board);
        }
      } catch (err) {
        if (!cancelled) setError(mapError(err).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  useEffect(() => {
    if (user?.interests?.length) setInterests(user.interests);
    if (user?.theme_preference) {
      setThemePreference(user.theme_preference as ThemePreference);
    }
  }, [user, setInterests, setThemePreference]);

  useEffect(() => {
    if (location.hash !== '#settings') return;
    setTab('overview');
    const timer = window.setTimeout(() => {
      document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

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
      setSaved('Görünüm kaydedildi.');
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
          Profil
        </h1>
        <p className="mt-1 text-sm text-theme-muted">Sekmelere tıklayarak bölümlere geçin</p>
      </header>

      {error ? (
        <ErrorAlert error={{ kind: 'api', message: error, actionLabel: 'Keşfe dön', actionTo: '/discover' }} />
      ) : null}
      {saved ? (
        <p className="alert-success rounded-xl px-3 py-2 text-sm font-semibold" role="status">
          {saved}
        </p>
      ) : null}

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Profil sekmeleri">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tap-scale inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${
              tab === id ? 'profile-tab--active' : 'profile-tab'
            }`}
            onClick={() => setTab(id)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <div className="theme-card flex items-center gap-4 p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold">
              {initials}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-theme">{user?.full_name}</h2>
              <p className="text-sm text-theme-muted">{user?.email}</p>
              <span className="badge-pill mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold">
                {user?.role === 'guide' ? t('profile.guide', 'Rehber') : t('profile.tourist', 'Turist')}
              </span>
              {user?.is_premium ? (
                <span className="badge-pill ml-2 mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-100">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                  Premium
                </span>
              ) : (
                <Link className="ml-2 mt-1 inline-flex text-xs font-bold text-primary underline" to="/premium">
                  Premium’a geç
                </Link>
              )}
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
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Zap} value={String(xp)} label="XP" />
            <StatCard icon={Flame} value={String(streak)} label="Streak" />
            <StatCard icon={Award} value={`#${rank}`} label="Haftalık" />
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
          <SectionTitle title="Tamamlanan rotalar" />
          {completedPlans.length === 0 ? (
            <EmptyHint
              text="Henüz tamamlanan gezi yok."
              link="/discover"
              linkLabel="Kişisel rotanı oluştur"
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
          <SectionTitle title="Planlanan geziler" />
          {upcomingPlans.length === 0 ? (
            <EmptyHint text="Takvimde plan yok." link="/planner" linkLabel="Plan oluştur" />
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
          <SectionTitle title="Kişisel rota notları" />
          {notes.length === 0 ? (
            <EmptyHint text="Henüz not yok. Rota detayında kendi notunu kaydedebilirsin." link="/discover" linkLabel="Rota seç" />
          ) : (
            notes.map((note) => (
              <div key={note.note_id} className="theme-card p-4">
                <Link className="font-bold text-primary hover:underline" to={`/routes/${note.route_id}`}>
                  {routeById.get(note.route_id)?.title ?? `Rota #${note.route_id}`}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-theme">{note.content}</p>
                <p className="mt-2 text-xs text-theme-muted">
                  Güncellendi: {new Date(note.updated_at).toLocaleString('tr-TR')}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'play' ? (
        <div className="space-y-5">
          <div className="theme-card rounded-[22px] border p-5">
            <h2 className="font-display text-lg font-bold text-theme">Kültür puanı (XP) nasıl kazanılır?</h2>
            <p className="mt-1 text-sm text-theme-muted">
              XP hem seviye hem mağaza parasıdır. Aşağıdaki aksiyonlar otomatik işlenir.
            </p>
            <ul className="mt-4 space-y-2">
              {(xpRules.length ? xpRules : [{ id: 'welcome', title: 'Hoş geldin', description: 'Kayıt', xp: 100 }]).map(
                (rule) => (
                  <li
                    key={rule.id}
                    className="list-row flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                  >
                    <span>
                      <strong className="text-theme">{rule.title}</strong>
                      <span className="block text-xs text-theme-muted">{rule.description}</span>
                    </span>
                    <span className="font-bold text-primary">+{rule.xp} XP</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <SectionTitle title="Ödül mağazası (XP harca)" />
          <p className="text-sm text-theme-muted">
            Kupon ve indirimler ödeme ekranında kod ile uygulanır. Sahip olduğunuz ödüller profilde listelenir.
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
                  <h3 className="font-bold text-theme">{reward.title}</h3>
                  <span className="badge-pill shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
                    {reward.value_label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-theme-muted">{reward.description}</p>
                <p className="mt-2 text-sm font-bold text-primary">{reward.cost_xp} XP</p>
                {reward.owned ? (
                  <p className="mt-2 text-xs font-semibold text-theme-muted">Aktif · ödeme kodunuz profilde</p>
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
                    {redeemBusy === reward.id ? '…' : 'Kullan'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {redeemedRewards.length > 0 ? (
            <p className="text-xs text-theme-muted">
              Aktif kodlar: {redeemedRewards.map((id) => `HG-${id.toUpperCase()}`).join(', ')}
            </p>
          ) : null}

          <SectionTitle title="Rozetler" />
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
                  <span className="text-[11px] font-bold text-theme">{BADGE_LABELS[id] ?? id}</span>
                </div>
              );
            })}
          </div>
          <SectionTitle title="Haftalık yarışma" />
          <p className="text-sm text-theme-muted">
            {rank != null ? (
              <>
                Bu hafta <strong className="text-theme">#{rank}</strong> sıradasın.
              </>
            ) : (
              'Liderlik tablosu yükleniyor…'
            )}{' '}
            En çok XP kazanan gezginler ödül rozeti alır.
          </p>
          <ol className="theme-card space-y-2 p-4">
            {boardEntries.length === 0 ? (
              <li className="list-row rounded-xl px-3 py-2 text-sm text-theme-muted">Henüz sıralama verisi yok.</li>
            ) : (
              boardEntries.map((entry) => {
                const isYou = user?.user_id === entry.user_id;
                return (
                  <li
                    key={entry.user_id}
                    className={`list-row flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                      entry.rank <= 3 ? 'font-bold ring-1 ring-[var(--hg-primary)]' : ''
                    } ${isYou ? 'border-2 border-[var(--hg-primary)]' : ''}`}
                  >
                    <span className="text-theme">
                      #{entry.rank} {entry.full_name}
                      {isYou ? ' (Sen)' : ''}
                    </span>
                    <span className="font-bold text-primary">{entry.xp} XP</span>
                  </li>
                );
              })
            )}
            {user && rank != null && !viewerOnBoard ? (
              <li className="list-row flex items-center justify-between rounded-xl border-2 border-[var(--hg-primary)] px-3 py-2 text-sm font-bold">
                <span className="text-theme">#{rank} Sen</span>
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
            Görünüm özelleştirme
          </h2>
          <p className="text-sm text-theme-muted">
            Her tema farklı bir İstanbul hikâyesi anlatır: arka plan, menü, kartlar, buton ve font birlikte değişir. Seçim anında
            uygulanır.
          </p>
          <div>
            <p className="mb-3 text-sm font-bold text-theme">Tema seçin</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {THEME_META.map((meta) => (
                <ThemePreviewCard
                  key={meta.id}
                  label={THEME_LABELS[meta.id]}
                  meta={meta}
                  selected={themePreference === meta.id}
                  onSelect={() => handleSaveTheme(meta.id)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-theme">Yazı tipi</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(Object.keys(FONT_LABELS) as FontPreference[]).map((f) => (
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
                  <span className="block font-bold">{FONT_LABELS[f]}</span>
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
            Çıkış yap
          </button>
        </div>
      ) : null}

      <SiteFooter className="mt-10" />
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Zap;
  value: string;
  label: string;
}): ReactElement {
  return (
    <div className="stat-tile rounded-2xl p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
      <p className="mt-2 text-xl font-bold text-theme">{value}</p>
      <p className="stat-label text-xs font-semibold">{label}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }): ReactElement {
  return <h2 className="font-display text-lg font-bold text-theme">{title}</h2>;
}

function EmptyHint({
  text,
  link,
  linkLabel,
}: {
  text: string;
  link?: string;
  linkLabel?: string;
}): ReactElement {
  return (
    <p className="theme-card rounded-xl border border-dashed px-4 py-6 text-center text-sm text-theme-muted">
      {text}
      {link ? (
        <>
          {' '}
          <Link className="font-bold text-primary hover:underline" to={link}>
            {linkLabel}
          </Link>
        </>
      ) : null}
    </p>
  );
}

function HistoryRow({
  title,
  subtitle,
  routeId,
  routeTitle,
}: {
  title: string;
  subtitle: string;
  routeId: number | null;
  routeTitle?: string;
}): ReactElement {
  return (
    <li className="theme-card flex items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="font-semibold text-theme">{title}</p>
        <p className="text-xs text-theme-muted">{subtitle}</p>
        {routeTitle ? <p className="text-xs text-primary">{routeTitle}</p> : null}
      </div>
      {routeId != null ? (
        <Link className="shrink-0 text-sm font-bold text-primary hover:underline" to={`/routes/${routeId}`}>
          Aç
        </Link>
      ) : null}
    </li>
  );
}
