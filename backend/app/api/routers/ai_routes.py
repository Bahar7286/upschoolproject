from fastapi import APIRouter, Depends

from app.api.dependencies import get_ai_service
from app.schemas.ai_schema import (
    AIRecommendationItem,
    AIRecommendationRequest,
    AIStatusResponse,
    AssistantChatRequest,
    AssistantChatResponse,
    GeofenceCheckRequest,
    GeofenceCheckResponse,
    NarrationAudioRequest,
    NarrationAudioResponse,
    PersonalRouteGenerateRequest,
    PersonalRouteGenerateResponse,
    StopNarrationRequest,
    StopNarrationResponse,
)
from app.services.ai_service import AIService

router = APIRouter()


@router.get('/status', response_model=AIStatusResponse)
async def ai_status() -> AIStatusResponse:
    """LLM (OpenRouter) yapılandırması — demo ve deploy doğrulaması için."""
    return AIService.status()


@router.post('/recommend', response_model=list[AIRecommendationItem])
async def recommend_with_ai(
    payload: AIRecommendationRequest,
    service: AIService = Depends(get_ai_service),
) -> list[AIRecommendationItem]:
    return await service.generate_recommendations(payload)


@router.post('/routes/generate', response_model=PersonalRouteGenerateResponse)
async def generate_personal_route(
    payload: PersonalRouteGenerateRequest,
    service: AIService = Depends(get_ai_service),
) -> PersonalRouteGenerateResponse:
    """AI ile kişisel gezi rotası — aday mekanlardan durak seçimi ve sıralama."""
    return await service.generate_personal_route(payload)


@router.post('/geofence-check', response_model=GeofenceCheckResponse)
async def geofence_check(
    payload: GeofenceCheckRequest,
    service: AIService = Depends(get_ai_service),
) -> GeofenceCheckResponse:
    """MVP: kullanıcı bir durağa 20 m yaklaşınca sesli rehber tetiklenir."""
    return await service.check_geofence(payload)


@router.post('/narration/preview', response_model=StopNarrationResponse)
async def narration_preview(
    payload: StopNarrationRequest,
    service: AIService = Depends(get_ai_service),
) -> StopNarrationResponse:
    return await service.preview_narration(payload)


@router.post('/narration/audio', response_model=NarrationAudioResponse)
async def narration_audio(
    payload: NarrationAudioRequest,
    service: AIService = Depends(get_ai_service),
) -> NarrationAudioResponse:
    """edge-tts ile MP3 (base64); paket yoksa tarayıcı TTS fallback bayrağı."""
    return await service.narration_audio(payload)


@router.post('/assistant/chat', response_model=AssistantChatResponse)
async def assistant_chat(
    payload: AssistantChatRequest,
    service: AIService = Depends(get_ai_service),
) -> AssistantChatResponse:
    """Turist AI asistanı (chat)."""
    return await service.chat_assistant(payload)
