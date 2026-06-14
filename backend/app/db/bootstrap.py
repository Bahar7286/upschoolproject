from datetime import datetime, timezone
import os

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.data.city_landmarks import _LANDMARKS, city_landmark_places
from app.data.istanbul_district_coords import ISTANBUL_DISTRICT_COORDS
from app.data.istanbul_places import ISTANBUL_PLACES
from app.data.national_routes import city_route_templates, normalize_city_key
from app.data.tr_cities import TR_CITIES
from app.data.tr_districts import TR_DISTRICTS
from app.models.guide_profile_model import GuideProfile
from app.models.city_model import City
from app.models.district_model import District
from app.models.place_model import Place
from app.models.place_visit_model import PlaceVisit
from app.models.route_model import Route
from app.models.review_model import RouteReview
from app.models.stop_model import Stop
from app.models.user_model import User

_DEMO_PASSWORD = 'demo123'


async def seed_minimal_data(session: AsyncSession) -> None:
    """Demo kullanıcılar, rotalar, duraklar, İstanbul POI — geo bulk seed yok."""
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
                price=249.0,
                tags='history,museum',
                guide_id=2,
                status='published',
            ),
            Route(
                title='Kadikoy Street Art Trail',
                city='Istanbul',
                estimated_minutes=90,
                price=199.0,
                tags='art,food',
                guide_id=2,
                status='published',
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


async def seed_full_geo_data(session: AsyncSession) -> None:
    """81 il, 973 ilçe, landmark POI, şehir rotaları — integration geo testleri için."""
    await ensure_cities_seeded(session)
    await ensure_districts_seeded(session)
    await ensure_city_landmark_places_seeded(session)
    await ensure_city_routes_seeded(session)
    await ensure_route_stops_seeded(session)
    await ensure_co_visit_seed(session)


async def seed_initial_data(session: AsyncSession) -> None:
    """Tam geliştirme/üretim bootstrap — minimal + geo."""
    await seed_minimal_data(session)
    await seed_full_geo_data(session)


async def ensure_city_landmark_places_seeded(session: AsyncSession) -> None:
    """İstanbul dışındaki iller için landmark mekanları Place tablosuna ekle."""
    import logging

    log = logging.getLogger(__name__)
    added = 0
    for city_name in _LANDMARKS:
        count_row = await session.execute(
            select(func.count(Place.place_id)).where(Place.city == city_name)
        )
        if (count_row.scalar() or 0) > 0:
            continue
        for lm_row in _LANDMARKS.get(city_name) or []:
            addr = str(lm_row.get('address') or '').strip()
            district = addr.split(',')[0].strip() if addr else ''
            desc = str(lm_row.get('description') or addr or lm_row['name']).strip()
            session.add(
                Place(
                    name=str(lm_row['name']),
                    category=str(lm_row.get('category') or 'historical'),
                    city=city_name,
                    district=district,
                    latitude=float(lm_row.get('lat') or 0),
                    longitude=float(lm_row.get('lng') or 0),
                    description=desc[:3500],
                    tags=str(lm_row.get('category') or 'historical'),
                )
            )
            added += 1
    if added:
        await session.commit()
        log.info('Landmark POI seed: %s places added for %s cities', added, len(_LANDMARKS))


async def ensure_cities_seeded(session: AsyncSession) -> None:
    """81 il — eksik kayıtları tamamla (kısmi seed sonrası)."""
    existing_ids = set(
        (await session.execute(select(City.city_id))).scalars().all()
    )
    to_add: list[City] = []
    for item in TR_CITIES:
        if item['id'] in existing_ids:
            continue
        to_add.append(
            City(
                city_id=item['id'],
                name_tr=item['name'],
                slug=item['slug'],
                plate_code=item['plate'],
                center_lat=item.get('lat', 0.0),
                center_lng=item.get('lng', 0.0),
            )
        )
    if to_add:
        session.add_all(to_add)
        await session.commit()


async def ensure_districts_seeded(session: AsyncSession) -> None:
    """Tüm iller için eksik ilçeleri ekle (kısmi seed sonrası boş kalan iller için)."""
    existing_ids = set(
        (await session.execute(select(District.district_id))).scalars().all()
    )
    city_rows = await session.execute(select(City))
    city_coords = {
        c.city_id: (float(c.center_lat), float(c.center_lng))
        for c in city_rows.scalars().all()
    }
    to_add: list[District] = []
    for item in TR_DISTRICTS:
        if item['id'] in existing_ids:
            continue
        lat, lng = city_coords.get(item['provinceId'], (0.0, 0.0))
        to_add.append(
            District(
                district_id=item['id'],
                city_id=item['provinceId'],
                name_tr=item['name'],
                slug=item['slug'],
                center_lat=lat,
                center_lng=lng,
            )
        )
    if to_add:
        session.add_all(to_add)
        await session.commit()

    zero_rows = await session.execute(
        select(District).where(District.center_lat == 0.0, District.center_lng == 0.0)
    )
    patched = False
    for d in zero_rows.scalars().all():
        coords = city_coords.get(d.city_id)
        if coords and (coords[0] != 0.0 or coords[1] != 0.0):
            d.center_lat, d.center_lng = coords
            patched = True
    if patched:
        await session.commit()

    # İstanbul ilçeleri için gerçek merkez koordinatları
    istanbul_city = await session.execute(select(City.city_id).where(City.slug == 'istanbul').limit(1))
    istanbul_id = istanbul_city.scalar_one_or_none()
    if istanbul_id:
        dist_rows = await session.execute(select(District).where(District.city_id == istanbul_id))
        coord_patched = False
        for d in dist_rows.scalars().all():
            slug = (d.slug or '').lower()
            coords = ISTANBUL_DISTRICT_COORDS.get(slug)
            if coords and (d.center_lat != coords[0] or d.center_lng != coords[1]):
                d.center_lat, d.center_lng = coords
                coord_patched = True
        if coord_patched:
            await session.commit()


async def ensure_place_descriptions_enriched(session: AsyncSession) -> None:
    """Kısa mekan açıklamalarını Wikipedia ile zenginleştir (sesli anlatım kalitesi)."""
    if os.getenv('TESTING') == '1':
        return
    import logging

    from app.services.place_content_service import enrich_places_batch

    log = logging.getLogger(__name__)
    try:
        updated = await enrich_places_batch(session, limit=250)
        if updated:
            log.info('Wikipedia place descriptions: %s updated', updated)
    except Exception as exc:
        log.warning('Place description enrich skipped: %s', exc)


async def ensure_images_seeded(session: AsyncSession) -> None:
    """Eksik city/place image_url alanlarını Wikipedia'dan doldur."""
    if os.getenv('TESTING') == '1':
        return
    import logging

    from sqlalchemy import func, or_

    from app.services.image_sync_service import ImageSyncService

    log = logging.getLogger(__name__)
    svc = ImageSyncService(session)

    missing_cities = (
        await session.execute(
            select(func.count())
            .select_from(City)
            .where(or_(City.image_url.is_(None), City.image_url == ''))
        )
    ).scalar() or 0

    missing_places = (
        await session.execute(
            select(func.count())
            .select_from(Place)
            .where(or_(Place.image_url.is_(None), Place.image_url == ''))
        )
    ).scalar() or 0

    if missing_cities == 0 and missing_places == 0:
        return

    try:
        if missing_cities:
            result = await svc.sync_cities(limit=81, force=False)
            log.info('Wikipedia city images: %s/%s updated', result.updated, missing_cities)
        if missing_places:
            result = await svc.sync_places(limit=min(missing_places, 250), force=False)
            log.info('Wikipedia place images: %s/%s updated', result.updated, missing_places)
    except Exception as exc:
        log.warning('Wikipedia image sync skipped: %s', exc)


async def ensure_city_routes_seeded(session: AsyncSession) -> None:
    """81 il — eksik şehirler için en az bir kayıtlı rota."""
    guide_row = await session.execute(
        select(User.user_id).where(User.email == 'guide@example.com').limit(1)
    )
    guide_id = guide_row.scalar_one_or_none() or 2

    existing = await session.execute(select(Route.city))
    covered = {normalize_city_key(str(c or '')) for c in existing.scalars().all()}

    to_add: list[Route] = []
    for item in city_route_templates():
        key = normalize_city_key(item['city'])
        if key in covered:
            continue
        to_add.append(
            Route(
                title=item['title'],
                city=item['city'],
                estimated_minutes=int(item['estimated_minutes']),
                price=float(item['price']),
                tags=str(item['tags']),
                guide_id=guide_id,
                status='published',
            )
        )
        covered.add(key)

    if to_add:
        session.add_all(to_add)
        await session.commit()


async def ensure_route_stops_seeded(session: AsyncSession) -> None:
    """Duraksız rotalara il bazlı en az 3 durak ekle (DB mekan → landmark → şehir merkezi)."""
    import logging

    log = logging.getLogger(__name__)
    routes = list((await session.execute(select(Route))).scalars().all())
    if not routes:
        return

    city_rows = list((await session.execute(select(City))).scalars().all())
    city_by_name = {normalize_city_key(c.name_tr): c for c in city_rows}

    added = 0
    for route in routes:
        count_row = await session.execute(
            select(func.count(Stop.stop_id)).where(Stop.route_id == route.route_id)
        )
        if (count_row.scalar() or 0) > 0:
            continue

        city = (route.city or '').strip()
        if not city:
            continue

        place_rows = await session.execute(
            select(Place)
            .where(Place.city == city)
            .order_by(Place.place_id.asc())
            .limit(8)
        )
        places = list(place_rows.scalars().all())

        stop_defs: list[tuple[str, str, float, float]] = []
        for p in places[:5]:
            desc = (p.description or '').strip() or f'{p.name} — {p.district}, {city}'
            stop_defs.append((p.name, desc, float(p.latitude), float(p.longitude)))

        if len(stop_defs) < 2:
            for lm in city_landmark_places(city)[:5]:
                stop_defs.append(
                    (
                        lm.name,
                        lm.address or lm.name,
                        float(lm.lat),
                        float(lm.lng),
                    )
                )

        if len(stop_defs) < 2:
            c = city_by_name.get(normalize_city_key(city))
            if c and (float(c.center_lat) or float(c.center_lng)):
                lat, lng = float(c.center_lat), float(c.center_lng)
                templates = (
                    (f'{city} merkez keşfi', f'{city} şehir merkezi ve çevre yürüyüşü', 0.0, 0.0),
                    (f'{city} tarihi çevre', f'{city} tarihî noktalar', 0.012, 0.006),
                    (f'{city} yerel lezzet', f'{city} bölgesinde yemek molası', -0.008, 0.005),
                )
                for title, desc, dla, dlg in templates:
                    stop_defs.append((title, desc, lat + dla, lng + dlg))

        if not stop_defs:
            continue

        seen: set[str] = set()
        order = 1
        for title, desc, lat, lng in stop_defs:
            key = title.strip().lower()
            if key in seen:
                continue
            seen.add(key)
            session.add(
                Stop(
                    route_id=route.route_id,
                    title=title[:180],
                    description=desc[:900],
                    latitude=lat,
                    longitude=lng,
                    order_index=order,
                )
            )
            order += 1
            if order > 5:
                break
        added += 1

    if added:
        await session.commit()
        log.info('Route stops seeded for %s routes without stops', added)


async def ensure_co_visit_seed(session: AsyncSession) -> None:
    """Demo co-visit verisi — Topkapı gezenler Galata, Ayasofya vb. de gezmiş gibi."""
    import logging

    from app.repositories.place_visit_repository import PlaceVisitRepository

    log = logging.getLogger(__name__)
    repo = PlaceVisitRepository(session)
    if await repo.has_any_visits():
        return

    rows = await session.execute(select(Place.place_id, Place.name, Place.city))
    by_name = {name: (pid, city) for pid, name, city in rows.all()}
    anchor = 'Topkapı Sarayı'
    if anchor not in by_name:
        return

    also_names = [
        'Galata Kulesi',
        'Ayasofya-i Kebir Camii',
        'Kapalıçarşı',
        'Yerebatan Sarnıcı',
        'Sultanahmet Camii',
    ]
    also_ids: list[tuple[int, str, str]] = []
    for n in also_names:
        if n in by_name:
            pid, city = by_name[n]
            also_ids.append((pid, n, city))

    if not also_ids:
        return

    anchor_id, anchor_city = by_name[anchor]
    visits: list[PlaceVisit] = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for user_idx in range(1, 31):
        user_id = 1000 + user_idx
        visits.append(
            PlaceVisit(
                user_id=user_id,
                entity_type='place',
                entity_key=str(anchor_id),
                place_name=anchor,
                city=anchor_city,
                source='seed',
                visited_at=now,
            )
        )
        for j, (pid, pname, pcity) in enumerate(also_ids):
            threshold = max(1, 28 - j * 3)
            if user_idx <= threshold:
                visits.append(
                    PlaceVisit(
                        user_id=user_id,
                        entity_type='place',
                        entity_key=str(pid),
                        place_name=pname,
                        city=pcity,
                        source='seed',
                        visited_at=now,
                    )
                )

    galata = by_name.get('Galata Kulesi')
    if galata:
        gid, gcity = galata
        for user_idx in range(31, 41):
            user_id = 1000 + user_idx
            visits.append(
                PlaceVisit(
                    user_id=user_id,
                    entity_type='place',
                    entity_key=str(gid),
                    place_name='Galata Kulesi',
                    city=gcity,
                    source='seed',
                    visited_at=now,
                )
            )
            if user_idx <= 38 and anchor_id:
                visits.append(
                    PlaceVisit(
                        user_id=user_id,
                        entity_type='place',
                        entity_key=str(anchor_id),
                        place_name=anchor,
                        city=anchor_city,
                        source='seed',
                        visited_at=now,
                    )
                )

    await repo.bulk_insert_visits(visits)
    log.info('Co-visit seed: %s kayıt (Topkapı ↔ Galata demo)', len(visits))
