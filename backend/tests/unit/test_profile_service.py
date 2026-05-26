import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase_model import Purchase
from app.repositories.user_repository import UserRepository
from app.services import profile_service

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_gam_u01_leaderboard_sorted_by_xp(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    board = await profile_service.get_leaderboard(db_session, viewer_id=tourist.user_id)
    assert len(board.entries) >= 1
    xps = [e.xp for e in board.entries]
    assert xps == sorted(xps, reverse=True)
    assert board.entries[0].rank == 1


@pytest.mark.asyncio
async def test_gam_u02_your_rank_for_viewer(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    board = await profile_service.get_leaderboard(db_session, viewer_id=tourist.user_id)
    assert board.your_rank is not None
    assert board.your_rank >= 1


@pytest.mark.asyncio
async def test_gam_u03_complete_route_requires_purchase(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    with pytest.raises(HTTPException) as exc:
        await profile_service.complete_route(db_session, tourist.user_id, route_id=1)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_gam_u04_complete_route_after_purchase(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    db_session.add(
        Purchase(
            user_id=tourist.user_id,
            route_id=1,
            amount=9.9,
            currency='TRY',
            status='confirmed',
            transaction_ref='HG-TEST-001',
        )
    )
    await db_session.commit()
    result = await profile_service.complete_route(db_session, tourist.user_id, route_id=1)
    assert result.xp_gained == 100
    assert result.total_xp >= tourist.xp


@pytest.mark.asyncio
async def test_gam_u05_redeem_insufficient_xp(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    tourist.xp = 10
    await db_session.commit()
    with pytest.raises(HTTPException) as exc:
        await profile_service.redeem_reward(db_session, tourist.user_id, 'coupon_10')
    assert exc.value.status_code == 402


@pytest.mark.asyncio
async def test_gam_preferences_and_gamification(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    from app.schemas.user_schema import UserPreferencesUpdate

    prefs = await profile_service.update_preferences(
        db_session,
        tourist.user_id,
        UserPreferencesUpdate(
            interests=['history', 'museum'],
            duration_minutes=180,
            budget=200.0,
            theme_preference='heritage',
            preferred_language='en',
            onboarding_completed=True,
        ),
    )
    assert 'history' in prefs.interests
    assert prefs.preferred_language == 'en'

    gam = await profile_service.get_gamification(db_session, tourist.user_id)
    assert gam.xp >= 0
    assert gam.weekly_rank >= 1


@pytest.mark.asyncio
async def test_gam_redeem_success(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    tourist.xp = 500
    await db_session.commit()
    result = await profile_service.redeem_reward(db_session, tourist.user_id, 'coupon_10')
    assert result.code.startswith('HG-')
    assert result.remaining_xp < 500


@pytest.mark.asyncio
async def test_gam_redeem_duplicate_raises_409(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    tourist.xp = 600
    tourist.redeemed_rewards = 'coupon_10'
    await db_session.commit()
    with pytest.raises(HTTPException) as exc:
        await profile_service.redeem_reward(db_session, tourist.user_id, 'coupon_10')
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_gam_user_not_found(db_session: AsyncSession) -> None:
    with pytest.raises(HTTPException) as exc:
        await profile_service.get_gamification(db_session, 999_999)
    assert exc.value.status_code == 404
