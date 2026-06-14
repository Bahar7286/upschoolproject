from fastapi import APIRouter, Depends
from fastapi.responses import Response

from app.api.dependencies import get_seo_service
from app.services.seo_service import SeoService

router = APIRouter()


@router.get('/sitemap.xml', response_class=Response)
async def sitemap_xml(service: SeoService = Depends(get_seo_service)) -> Response:
    content = await service.build_sitemap_xml()
    return Response(content=content, media_type='application/xml')
