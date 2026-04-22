from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.route_model import Route
from app.models.user_model import User


async def seed_initial_data(session: AsyncSession) -> None:
    existing_users = await session.execute(select(User.user_id).limit(1))
    if existing_users.first():
        return

    users = [
        User(full_name='Demo Tourist', email='tourist@example.com', role='tourist'),
        User(full_name='Demo Guide', email='guide@example.com', role='guide'),
    ]
    routes = [
        Route(
            title='Istanbul Old City Walk',
            city='Istanbul',
            estimated_minutes=120,
            price=9.9,
            tags='history,museum',
            guide_id=2,
        ),
        Route(
            title='Kadikoy Street Art Trail',
            city='Istanbul',
            estimated_minutes=90,
            price=7.5,
            tags='art,food',
            guide_id=2,
        ),
    ]
    session.add_all(users + routes)
    await session.commit()
