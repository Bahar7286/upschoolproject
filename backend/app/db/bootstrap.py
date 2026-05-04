from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.route_model import Route
from app.models.user_model import User

# Swagger / geliştirme için demo girişi: e-posta + şifre `demo123`
_DEMO_PASSWORD = 'demo123'


async def seed_initial_data(session: AsyncSession) -> None:
    existing_users = await session.execute(select(User.user_id).limit(1))
    if existing_users.first():
        return

    demo_hash = hash_password(_DEMO_PASSWORD)
    users = [
        User(
            full_name='Demo Tourist',
            email='tourist@example.com',
            role='tourist',
            password_hash=demo_hash,
        ),
        User(
            full_name='Demo Guide',
            email='guide@example.com',
            role='guide',
            password_hash=demo_hash,
        ),
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
