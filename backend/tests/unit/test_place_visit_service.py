import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.place_model import Place
from app.repositories.place_repository import PlaceRepository
from app.repositories.place_visit_repository import PlaceVisitRepository
from app.services.place_visit_service import PlaceVisitService


@pytest.mark.asyncio
async def test_also_visited_co_occurrence(db_session: AsyncSession) -> None:
    topkapi = Place(
        name='Topkapı Sarayı Test',
        category='palace',
        city='Istanbul',
        district='Fatih',
        latitude=41.01,
        longitude=28.98,
        description='',
        tags='',
    )
    galata = Place(
        name='Galata Kulesi Test',
        category='historical',
        city='Istanbul',
        district='Beyoğlu',
        latitude=41.02,
        longitude=28.97,
        description='',
        tags='',
    )
    db_session.add_all([topkapi, galata])
    await db_session.commit()
    await db_session.refresh(topkapi)
    await db_session.refresh(galata)

    visit_repo = PlaceVisitRepository(db_session)
    place_repo = PlaceRepository(db_session)
    service = PlaceVisitService(visit_repo=visit_repo, place_repo=place_repo)

    for uid in range(1, 11):
        await visit_repo.upsert_visit(
            user_id=uid,
            entity_type='place',
            entity_key=str(topkapi.place_id),
            place_name=topkapi.name,
            city='Istanbul',
            source='test',
        )
    for uid in range(1, 8):
        await visit_repo.upsert_visit(
            user_id=uid,
            entity_type='place',
            entity_key=str(galata.place_id),
            place_name=galata.name,
            city='Istanbul',
            source='test',
        )

    result = await service.also_visited(
        entity_type='place',
        entity_key=str(topkapi.place_id),
        city='Istanbul',
        limit=5,
        source_place_name=topkapi.name,
    )

    assert result.total_visitors == 10
    assert len(result.items) >= 1
    assert result.items[0].place_id == galata.place_id
    assert result.items[0].co_visit_count == 7
    assert result.items[0].co_visit_percent == 70.0
