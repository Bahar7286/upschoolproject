from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase_model import Purchase
from app.models.user_model import User
from app.core.gamification import REWARD_CATALOG, XP_RULES
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import (
    CompleteRouteResponse,
    GamificationResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    RedeemRewardResponse,
    RewardItem,
    UserPreferencesUpdate,
    UserResponse,
    XpRuleItem,
)

_LEVELS: list[tuple[int, str]] = [
    (0, 'Gezgin'),
    (200, 'Kaşif'),
    (500, 'Tarih Dostu'),
    (1000, 'Şehir Üstadı'),
    (2500, 'Efsanevi Rehber'),
]

_BADGE_LABELS: dict[str, str] = {
    'welcome': 'Hoş Geldin',
    'first_step': 'İlk Adım',
    'route_explorer': 'Rota Kaşifi',
    'streak_3': 'Azimli Gezgin',
    'streak_7': 'Şehir Çınarı',
}


def _split_csv(value: str) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(',') if part.strip()]


def _join_csv(values: list[str]) -> str:
    return ','.join(dict.fromkeys(v.strip() for v in values if v.strip()))


def _level_info(xp: int) -> tuple[int, str, int]:
    level = 1
    name = _LEVELS[0][1]
    next_xp = _LEVELS[1][0] if len(_LEVELS) > 1 else xp + 500
    for idx, (threshold, label) in enumerate(_LEVELS):
        if xp >= threshold:
            level = idx + 1
            name = label
            next_xp = _LEVELS[idx + 1][0] if idx + 1 < len(_LEVELS) else threshold + 500
    return level, name, next_xp


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        interests=_split_csv(user.interests),
        duration_minutes=user.duration_minutes,
        budget=user.budget,
        theme_preference=user.theme_preference,
        preferred_language=user.preferred_language,
        onboarding_completed=user.onboarding_completed,
        xp=user.xp,
        streak_days=user.streak_days,
        badges=_split_csv(user.badges),
    )


def gamification_response(user: User) -> GamificationResponse:
    level, level_name, next_xp = _level_info(user.xp)
    redeemed = _split_csv(user.redeemed_rewards)
    return GamificationResponse(
        xp=user.xp,
        streak_days=user.streak_days,
        level=level,
        level_name=level_name,
        next_level_xp=next_xp,
        badges=_split_csv(user.badges),
        weekly_rank=max(1, 50 - user.xp // 25),
        xp_rules=[XpRuleItem.model_validate(r.model_dump()) for r in XP_RULES],
        rewards=[
            RewardItem(
                **r.model_dump(),
                owned=r.id in redeemed,
            )
            for r in REWARD_CATALOG
        ],
        redeemed_rewards=redeemed,
    )


def _touch_streak(user: User) -> None:
    today = date.today().isoformat()
    if user.last_active_date == today:
        return
    if user.last_active_date:
        try:
            last = date.fromisoformat(user.last_active_date)
            delta = (date.today() - last).days
            if delta == 1:
                user.streak_days += 1
            elif delta > 1:
                user.streak_days = 1
        except ValueError:
            user.streak_days = 1
    else:
        user.streak_days = 1
    user.last_active_date = today


def _award_badge(user: User, badge_id: str) -> bool:
    badges = _split_csv(user.badges)
    if badge_id in badges:
        return False
    badges.append(badge_id)
    user.badges = _join_csv(badges)
    return True


def _add_xp(user: User, amount: int) -> None:
    user.xp = max(0, user.xp + amount)
    _touch_streak(user)
    if user.streak_days >= 7:
        _award_badge(user, 'streak_7')
    elif user.streak_days >= 3:
        _award_badge(user, 'streak_3')


async def get_user_or_404(session: AsyncSession, user_id: int) -> User:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user


async def update_preferences(
    session: AsyncSession,
    user_id: int,
    payload: UserPreferencesUpdate,
) -> UserResponse:
    user = await get_user_or_404(session, user_id)
    user.interests = _join_csv(payload.interests)
    user.duration_minutes = payload.duration_minutes
    user.budget = payload.budget
    user.theme_preference = payload.theme_preference
    user.preferred_language = payload.preferred_language
    user.onboarding_completed = payload.onboarding_completed
    _touch_streak(user)
    await session.commit()
    await session.refresh(user)
    return user_to_response(user)


async def get_gamification(session: AsyncSession, user_id: int) -> GamificationResponse:
    user = await get_user_or_404(session, user_id)
    resp = gamification_response(user)
    repo = UserRepository(session)
    resp.weekly_rank = await repo.rank_by_xp(user_id, role='tourist')
    return resp


async def get_leaderboard(session: AsyncSession, viewer_id: int | None = None) -> LeaderboardResponse:
    repo = UserRepository(session)
    users = await repo.top_by_xp(limit=10, role='tourist')
    entries = [
        LeaderboardEntry(
            rank=idx,
            user_id=u.user_id,
            full_name=u.full_name,
            xp=u.xp,
            streak_days=u.streak_days,
            badge_count=len(_split_csv(u.badges)),
        )
        for idx, u in enumerate(users, start=1)
    ]
    your_rank = await repo.rank_by_xp(viewer_id, role='tourist') if viewer_id else None
    return LeaderboardResponse(entries=entries, your_rank=your_rank)


async def redeem_reward(session: AsyncSession, user_id: int, reward_id: str) -> RedeemRewardResponse:
    user = await get_user_or_404(session, user_id)
    offer = next((r for r in REWARD_CATALOG if r.id == reward_id), None)
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Reward not found')
    redeemed = _split_csv(user.redeemed_rewards)
    if reward_id in redeemed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Reward already redeemed')
    if user.xp < offer.cost_xp:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f'Need {offer.cost_xp} XP, you have {user.xp}',
        )
    user.xp -= offer.cost_xp
    redeemed.append(reward_id)
    user.redeemed_rewards = _join_csv(redeemed)
    await session.commit()
    await session.refresh(user)
    code = f'HG-{reward_id.upper()}-{user.user_id:04d}'
    return RedeemRewardResponse(
        reward_id=reward_id,
        title=offer.title,
        code=code,
        remaining_xp=user.xp,
        message=f'{offer.title} aktif. Ödeme ekranında kodu girin: {code}',
    )


async def award_xp_to_user(
    user_repo,
    user: User,
    rule_id: str,
    amount: int | None = None,
) -> None:
    """Repository üzerinden XP ekler (trip request vb.)."""
    xp_amount = amount
    if xp_amount is None:
        rule = next((r for r in XP_RULES if r.id == rule_id), None)
        xp_amount = rule.xp if rule else 0
    if xp_amount <= 0:
        return
    _add_xp(user, xp_amount)
    await user_repo.save(user)


async def apply_welcome_bonus(session: AsyncSession, user: User) -> None:
    apply_welcome_bonus_to_user(user)
    await session.commit()


def apply_welcome_bonus_to_user(user: User) -> None:
    _add_xp(user, 100)
    _award_badge(user, 'welcome')


async def apply_first_purchase_bonus(session: AsyncSession, user: User) -> list[str]:
    new_badges: list[str] = []
    _add_xp(user, 50)
    if _award_badge(user, 'first_step'):
        new_badges.append('first_step')
    await session.commit()
    return new_badges


async def complete_route(
    session: AsyncSession,
    user_id: int,
    route_id: int,
) -> CompleteRouteResponse:
    user = await get_user_or_404(session, user_id)

    purchase = await session.execute(
        select(Purchase).where(
            Purchase.user_id == user_id,
            Purchase.route_id == route_id,
            Purchase.status == 'confirmed',
        )
    )
    if not purchase.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Bu rotayı tamamlamak için önce satın almalısınız.',
        )

    new_badges: list[str] = []
    _add_xp(user, 100)
    if _award_badge(user, 'route_explorer'):
        new_badges.append('route_explorer')

    await session.commit()
    await session.refresh(user)
    _, level_name, _ = _level_info(user.xp)

    return CompleteRouteResponse(
        xp_gained=100,
        total_xp=user.xp,
        streak_days=user.streak_days,
        new_badges=new_badges,
        level_name=level_name,
    )
