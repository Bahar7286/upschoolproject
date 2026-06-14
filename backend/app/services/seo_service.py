from datetime import datetime, timezone
from xml.sax.saxutils import escape

from app.core.config import settings
from app.repositories.city_repository import CityRepository
from app.repositories.place_repository import PlaceRepository
from app.repositories.route_repository import RouteRepository

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


class SeoService:
    def __init__(
        self,
        route_repo: RouteRepository,
        city_repo: CityRepository,
        place_repo: PlaceRepository,
    ) -> None:
        self.routes = route_repo
        self.cities = city_repo
        self.places = place_repo

    async def build_sitemap_xml(self) -> str:
        base = settings.frontend_url.rstrip('/')
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        parts = ['<?xml version="1.0" encoding="UTF-8"?>\n', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n']

        for path in _STATIC_PATHS:
            pri = '1.0' if path == '/' else '0.8'
            parts.append(_url_entry(f'{base}{path}', today, pri))

        cities = await self.cities.list_all()
        for city in cities:
            parts.append(_url_entry(f'{base}/cities/{city.city_id}', today, '0.75'))

        routes = await self.routes.list_all(published_only=True, limit=500)
        for route in routes:
            parts.append(_url_entry(f'{base}/routes/{route.route_id}', today, '0.85'))

        places = await self.places.list_places(limit=200)
        for place in places:
            parts.append(_url_entry(f'{base}/places/{place.place_id}', today, '0.7'))

        parts.append('</urlset>')
        return ''.join(parts)
