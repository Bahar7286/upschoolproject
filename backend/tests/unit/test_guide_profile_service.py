import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import GuideNotFoundError, GuideNotVerifiedError, GuideProfileExistsError
from app.models.guide_profile_model import GuideProfile
from app.repositories.guide_profile_repository import GuideProfileRepository
from app.repositories.guide_repository import GuideRepository
from app.repositories.user_repository import UserRepository
from app.services.guide_profile_service import GuideProfileService
from tests.unit.helpers import create_guide_user, verification_payload

pytestmark = pytest.mark.unit


def _service(session: AsyncSession) -> GuideProfileService:
    return GuideProfileService(
        GuideProfileRepository(session),
        UserRepository(session),
        GuideRepository(session),
    )


@pytest.mark.asyncio
async def test_get_my_profile_verified_guide(db_session: AsyncSession) -> None:
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert guide
    profile = await _service(db_session).get_my_profile(guide.user_id)
    assert profile
    assert profile.is_verified is True
    assert 'Onaylı kokart' in profile.trust_badges


@pytest.mark.asyncio
async def test_get_public_profile_verified(db_session: AsyncSession) -> None:
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert guide
    public = await _service(db_session).get_public_profile(guide.user_id)
    assert public.verification_status == 'verified'


@pytest.mark.asyncio
async def test_get_public_profile_unverified_raises(db_session: AsyncSession) -> None:
    guide = await create_guide_user(db_session, email='unverified.guide@example.com')
    with pytest.raises(GuideNotVerifiedError):
        await _service(db_session).get_public_profile(guide.user_id)


@pytest.mark.asyncio
async def test_submit_verification_creates_profile(db_session: AsyncSession) -> None:
    guide = await create_guide_user(db_session, email='new.guide.verify@example.com')
    result = await _service(db_session).submit_verification(
        guide.user_id,
        verification_payload(),
    )
    assert result.verification_status == 'under_review'


@pytest.mark.asyncio
async def test_submit_verification_duplicate_raises(db_session: AsyncSession) -> None:
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert guide
    with pytest.raises(GuideProfileExistsError):
        await _service(db_session).submit_verification(guide.user_id, verification_payload())


@pytest.mark.asyncio
async def test_save_document_path_creates_pending(db_session: AsyncSession) -> None:
    guide = await create_guide_user(db_session, email='doc.guide@example.com')
    saved = await _service(db_session).save_document_path(guide.user_id, '/uploads/kokart.pdf')
    assert saved.document_path.endswith('kokart.pdf')
    assert saved.verification_status == 'pending'


@pytest.mark.asyncio
async def test_moderate_verify_and_reject(db_session: AsyncSession) -> None:
    guide = await create_guide_user(db_session, email='moderate.guide@example.com')
    await _service(db_session).submit_verification(guide.user_id, verification_payload())
    status = await _service(db_session).moderate_verification(guide.user_id, action='verify')
    assert status == 'verified'
    status = await _service(db_session).moderate_verification(
        guide.user_id,
        action='reject',
        rejection_reason='Eksik belge',
    )
    assert status == 'rejected'


@pytest.mark.asyncio
async def test_list_marketplace_includes_verified(db_session: AsyncSession) -> None:
    listing = await _service(db_session).list_marketplace(limit=10)
    assert listing.total >= 1
    assert any(item.is_verified for item in listing.items)


@pytest.mark.asyncio
async def test_list_pending_for_admin(db_session: AsyncSession) -> None:
    guide = await create_guide_user(db_session, email='pending.admin@example.com')
    await _service(db_session).submit_verification(guide.user_id, verification_payload())
    pending = await _service(db_session).list_pending_for_admin()
    assert any(p['guide_id'] == guide.user_id for p in pending)


@pytest.mark.asyncio
async def test_tourist_cannot_use_guide_profile(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    with pytest.raises(GuideNotFoundError):
        await _service(db_session).get_my_profile(tourist.user_id)
