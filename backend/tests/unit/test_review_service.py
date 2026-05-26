import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ReviewAlreadyExistsError, ReviewNotFoundError
from app.repositories.review_repository import ReviewRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review_schema import ReviewCreate, ReviewUpdate
from app.services.review_service import ReviewService

pytestmark = pytest.mark.unit


def _service(session: AsyncSession) -> ReviewService:
    return ReviewService(ReviewRepository(session), UserRepository(session))


@pytest.mark.asyncio
async def test_review_lifecycle(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    service = _service(db_session)
    created = await service.create_review(
        tourist.user_id,
        route_id=99,
        payload=ReviewCreate(rating=5, comment='Harika rota'),
    )
    listed = await service.list_reviews(99)
    assert any(r.review_id == created.review_id for r in listed)

    summary = await service.get_summary(99)
    assert summary.review_count >= 1

    updated = await service.update_review(
        created.review_id,
        tourist.user_id,
        99,
        ReviewUpdate(comment='Güncellendi'),
    )
    assert updated.comment == 'Güncellendi'

    await service.delete_review(created.review_id, tourist.user_id, 99)
    with pytest.raises(ReviewNotFoundError):
        await service.update_review(
            created.review_id,
            tourist.user_id,
            99,
            ReviewUpdate(rating=4),
        )


@pytest.mark.asyncio
async def test_duplicate_review_raises(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    service = _service(db_session)
    await service.create_review(
        tourist.user_id,
        route_id=88,
        payload=ReviewCreate(rating=4, comment='İlk'),
    )
    with pytest.raises(ReviewAlreadyExistsError):
        await service.create_review(
            tourist.user_id,
            route_id=88,
            payload=ReviewCreate(rating=3, comment='İkinci'),
        )
