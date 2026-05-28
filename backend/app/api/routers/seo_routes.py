from datetime import datetime, timezone
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.api.dependencies import get_city_repository, get_place_repository, get_route_repository
from app.core.config import settings
from app.repositories.city_repository import CityRepository
from app.repositories.place_repository import PlaceRepository
from app.repositories.route_repository import RouteRepository

router = APIRouter()

_STATIC_PATHS = [
    '/',
    '/discover',
    '/cities',
    '/rehberler',
    '/terms',
    '/privacy',
    '/kvkk',
    '/cerezler',
    '/iade',
    '/rehber-guven',
    '/odeme-guvenlik',
    '/iletisim',
    '/hakkimizda',
    '/sss',
]


def _url_entry(loc: str, lastmod: str | None = None, priority: str = '0.7') -> str:
    lm = f'    <lastmod>{lastmod}</lastmod>\n' if lastmod else ''
    return (
        '  <url>\n'
        f'    <loc>{escape(loc)}</loc>\n'
        f'{lm}'
        f'    <priority>{priority}</priority>\n'
        '  </url>\n'
    )


@router.get('/sitemap.xml', response_class=Response)
async def sitemap_xml(
    route_repo: RouteRepository = Depends(get_route_repository),
    city_repo: CityRepository = Depends(get_city_repository),
    place_repo: PlaceRepository = Depends(get_place_repository),
) -> Response:
    base = settings.frontend_url.rstrip('/')
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    parts = ['<?xml version="1.0" encoding="UTF-8"?>\n', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n']

    for path in _STATIC_PATHS:
        pri = '1.0' if path == '/' else '0.8'
        parts.append(_url_entry(f'{base}{path}', today, pri))

    cities = await city_repo.list_all()
    for city in cities:
        parts.append(_url_entry(f'{base}/cities/{city.city_id}', today, '0.75'))

    routes = await route_repo.list_all(published_only=True, limit=500)
    for route in routes:
        parts.append(_url_entry(f'{base}/routes/{route.route_id}', today, '0.85'))

    places = await place_repo.list_places(limit=200)
    for place in places:
        parts.append(_url_entry(f'{base}/places/{place.place_id}', today, '0.7'))

    parts.append('</urlset>')
    return Response(content=''.join(parts), media_type='application/xml')
