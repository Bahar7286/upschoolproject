from fastapi import APIRouter, Depends

from app.api.dependencies import get_ai_service
from app.schemas.ai_schema import AIRecommendationItem, AIRecommendationRequest
from app.services.ai_service import AIService

router = APIRouter()


@router.post('/recommend', response_model=list[AIRecommendationItem])
async def recommend_with_ai(
    payload: AIRecommendationRequest,
    service: AIService = Depends(get_ai_service),
) -> list[AIRecommendationItem]:
    return await service.generate_recommendations(payload)
