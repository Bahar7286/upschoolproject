from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime, timezone

from app.core.security import hash_password
from app.data.istanbul_places import ISTANBUL_PLACES
from app.data.tr_cities import TR_CITIES
from app.data.tr_districts import TR_DISTRICTS
from app.models.guide_profile_model import GuideProfile
from app.models.city_model import City
from app.models.district_model import District
from app.models.place_model import Place
from app.models.route_model import Route
from app.models.review_model import RouteReview
from app.models.stop_model import Stop
from app.models.user_model import User

_DEMO_PASSWORD = 'demo123'

_USER_MIGRATIONS: list[tuple[str, str]] = [
    ('interests', "TEXT NOT NULL DEFAULT ''"),
    ('duration_minutes', 'INTEGER NOT NULL DEFAULT 120'),
    ('budget', 'REAL NOT NULL DEFAULT 150.0'),
    ('theme_preference', "TEXT NOT NULL DEFAULT 'system'"),
    ('preferred_language', "TEXT NOT NULL DEFAULT 'tr'"),
    ('onboarding_completed', 'INTEGER NOT NULL DEFAULT 0'),
    ('xp', 'INTEGER NOT NULL DEFAULT 0'),
    ('streak_days', 'INTEGER NOT NULL DEFAULT 0'),
    ('badges', "TEXT NOT NULL DEFAULT ''"),
    ('last_active_date', 'TEXT'),
    ('password_reset_token', 'TEXT'),
    ('password_reset_expires', 'TEXT'),
]


async def _ensure_user_columns(session: AsyncSession) -> None:
    result = await session.execute(text('PRAGMA table_info(users)'))
    existing = {row[1] for row in result.fetchall()}
    for column, definition in _USER_MIGRATIONS:
        if column not in existing:
            await session.execute(text(f'ALTER TABLE users ADD COLUMN {column} {definition}'))
    await session.commit()


# PostgreSQL: create_all yeni tabloları ekler ama mevcut tablolara sütun eklemez.
_PG_COLUMN_MIGRATIONS: list[tuple[str, str, str]] = [
    ('users', 'redeemed_rewards', "VARCHAR(1000) NOT NULL DEFAULT ''"),
    ('guide_profiles', 'document_path', "VARCHAR(500) NOT NULL DEFAULT ''"),
    ('trip_requests', 'route_mode', "VARCHAR(20) NOT NULL DEFAULT 'existing'"),
    ('trip_requests', 'planned_stops', "TEXT NOT NULL DEFAULT '[]'"),
    ('purchases', 'transaction_ref', "VARCHAR(64) NOT NULL DEFAULT ''"),
    ('purchases', 'payment_method', "VARCHAR(20) NOT NULL DEFAULT 'card'"),
    ('purchases', 'offer_id', 'INTEGER'),
    ('purchases', 'trip_request_id', 'INTEGER'),
    ('purchases', 'stripe_session_id', 'VARCHAR(255)'),
    ('users', 'password_reset_token', 'VARCHAR(64)'),
    ('users', 'password_reset_expires', 'VARCHAR(30)'),
]


async def _pg_column_exists(session: AsyncSession, table: str, column: str) -> bool:
    result = await session.execute(
        text(
            'SELECT 1 FROM information_schema.columns '
            'WHERE table_schema = current_schema() AND table_name = :t AND column_name = :c'
        ),
        {'t': table, 'c': column},
    )
    return result.first() is not None


async def _ensure_postgres_columns(session: AsyncSession) -> None:
    for table, column, definition in _PG_COLUMN_MIGRATIONS:
        if not await _pg_column_exists(session, table, column):
            await session.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {definition}'))
    await session.commit()


async def seed_initial_data(session: AsyncSession) -> None:
    bind = session.get_bind()
    if bind.dialect.name == 'sqlite':
        await _ensure_user_columns(session)
    elif bind.dialect.name == 'postgresql':
        await _ensure_postgres_columns(session)

    existing_users = await session.execute(select(User.user_id).limit(1))
    if not existing_users.first():
        demo_hash = hash_password(_DEMO_PASSWORD)
        users = [
            User(
                full_name='Demo Tourist',
                email='tourist@example.com',
                role='tourist',
                password_hash=demo_hash,
                interests='history,art',
                onboarding_completed=True,
                xp=250,
                streak_days=2,
                badges='welcome',
            ),
            User(
                full_name='Demo Guide',
                email='guide@example.com',
                role='guide',
                password_hash=demo_hash,
                onboarding_completed=True,
                badges='welcome',
            ),
            User(
                full_name='Platform Admin',
                email='admin@example.com',
                role='admin',
                password_hash=demo_hash,
                onboarding_completed=True,
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

    admin_row = await session.execute(select(User.user_id).where(User.email == 'admin@example.com').limit(1))
    if not admin_row.scalar_one_or_none():
        session.add(
            User(
                full_name='Platform Admin',
                email='admin@example.com',
                role='admin',
                password_hash=hash_password(_DEMO_PASSWORD),
                onboarding_completed=True,
            )
        )
        await session.commit()

    existing_guide_profile = await session.execute(select(GuideProfile.profile_id).limit(1))
    if not existing_guide_profile.first():
        guide_row = await session.execute(
            select(User.user_id).where(User.email == 'guide@example.com').limit(1)
        )
        guide_id = guide_row.scalar_one_or_none()
        if guide_id:
            session.add(
                GuideProfile(
                    user_id=guide_id,
                    verification_status='verified',
                    license_number='IST-TR-DEMO-24001',
                    license_type='regional',
                    university='İstanbul Üniversitesi',
                    department='Turist Rehberliği',
                    graduation_year=2018,
                    languages='tr,en',
                    regions='Istanbul,Fatih',
                    document_summary=(
                        'Demo kayıt: T.C. Kültür ve Turizm Bakanlığı turist rehberi ruhsatnamesi '
                        've TUREB çalışma kartı özeti (gerçek ortamda belge yükleme zorunlu).'
                    ),
                    bio='İstanbul tarih, mimari ve gastronomi rotalarında 12+ yıl deneyim.',
                    specialties='history,museum,food',
                    min_group_size=1,
                    max_group_size=20,
                    base_price_per_person=120.0,
                    verified_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    submitted_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
            )
            await session.commit()

    existing_stops = await session.execute(select(Stop.stop_id).limit(1))
    if not existing_stops.first():
        route_rows = await session.execute(select(Route).order_by(Route.route_id.asc()))
        routes = list(route_rows.scalars().all())
        if len(routes) >= 2:
            stops = [
                Stop(
                    route_id=routes[0].route_id,
                    title='Sultanahmet Meydanı',
                    description='Bizans ve Osmanlı dönemlerinin kalbi. Hipodrom, Sultanahmet Camii ve Ayasofya bu meydandan yürüme mesafesindedir.',
                    latitude=41.0054,
                    longitude=28.9768,
                    order_index=1,
                ),
                Stop(
                    route_id=routes[0].route_id,
                    title='Ayasofya',
                    description='532 yılında inşa edilen bu yapı, hem cami hem müze olarak İstanbul siluetinin simgesidir.',
                    latitude=41.0086,
                    longitude=28.9802,
                    order_index=2,
                ),
                Stop(
                    route_id=routes[0].route_id,
                    title='Kapalıçarşı',
                    description='1461 yılından beri ticaretin kalbi. 4.000 dükkân ve 61 sokakla dünyanın en eski kapalı çarşılarından biri.',
                    latitude=41.0106,
                    longitude=28.9683,
                    order_index=3,
                ),
                Stop(
                    route_id=routes[1].route_id,
                    title='Kadıköy İskelesi',
                    description='Anadolu yakasının giriş kapısı. Balık ekmek, simit ve çay keyfi için ideal başlangıç noktası.',
                    latitude=40.9903,
                    longitude=29.0225,
                    order_index=1,
                ),
                Stop(
                    route_id=routes[1].route_id,
                    title='Moda Sahili',
                    description='Boğaz manzaralı yürüyüş yolu. Sokak sanatı duvarları ve butik kafelerle dolu.',
                    latitude=40.9847,
                    longitude=29.0273,
                    order_index=2,
                ),
            ]
            session.add_all(stops)
            await session.commit()

    existing_reviews = await session.execute(select(RouteReview.review_id).limit(1))
    if not existing_reviews.first():
        route_rows = await session.execute(select(Route).order_by(Route.route_id.asc()))
        routes = list(route_rows.scalars().all())
        if routes:
            reviews = [
                RouteReview(
                    user_id=1,
                    route_id=routes[0].route_id,
                    rating=5,
                    comment='Ayasofya anlatımı muhteşemdi. Kendi hızımda gezmek harika bir deneyim.',
                ),
                RouteReview(
                    user_id=1,
                    route_id=routes[1].route_id if len(routes) > 1 else routes[0].route_id,
                    rating=4,
                    comment='Kadıköy sokak sanatı rotası keyifli; kafe molaları için ideal.',
                ),
            ]
            session.add_all(reviews)
            await session.commit()

    existing_places = await session.execute(select(Place.place_id).limit(1))
    if not existing_places.first():
        places = [
            Place(
                name=item['name'],
                category=item['category'],
                city=item['city'],
                district=item.get('district', ''),
                latitude=item['latitude'],
                longitude=item['longitude'],
                description=item['description'],
                tags=item.get('tags', ''),
                is_partner=int(item.get('is_partner', 0)),
            )
            for item in ISTANBUL_PLACES
        ]
        session.add_all(places)
        await session.commit()

    existing_cities = await session.execute(select(City.city_id).limit(1))
    if not existing_cities.first():
        session.add_all(
            [
                City(
                    city_id=item['id'],
                    name_tr=item['name'],
                    slug=item['slug'],
                    plate_code=item['plate'],
                    center_lat=item.get('lat', 0.0),
                    center_lng=item.get('lng', 0.0),
                )
                for item in TR_CITIES
            ]
        )
        await session.commit()

    existing_districts = await session.execute(select(District.district_id).limit(1))
    if not existing_districts.first():
        session.add_all(
            [
                District(
                    district_id=item['id'],
                    city_id=item['provinceId'],
                    name_tr=item['name'],
                    slug=item['slug'],
                    center_lat=0.0,
                    center_lng=0.0,
                )
                for item in TR_DISTRICTS
            ]
        )
        await session.commit()
