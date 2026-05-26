import logging

from app.core.config import settings
from app.core.exceptions import RouteNotFoundError
from app.schemas.ai_schema import (
    AIRecommendationItem,
    AIRecommendationRequest,
    AIStatusResponse,
    GeofenceCheckRequest,
    GeofenceCheckResponse,
    NarrationAudioRequest,
    NarrationAudioResponse,
    StopNarrationRequest,
    StopNarrationResponse,
)
from app.services.llm_service import LLMServiceError, llm_service
from app.services.tts_service import synthesize_mp3_base64
from app.services.route_service import RouteService
from app.services.stop_service import StopService
from app.utils.geolocation import calculate_distance_meters, is_user_near_location

logger = logging.getLogger(__name__)

_CITY_POI = {
    'Istanbul': (41.0082, 28.9784),
    'Ankara': (39.9334, 32.8597),
}

_REASON_TEMPLATES = {
    'tag': 'İlgi alanlarınla uyumlu: {tags}',
    'budget': 'Bütçene uygun (₺{price})',
    'duration': 'Sürene uygun ({minutes} dk)',
    'proximity': 'Şu an bulunduğun bölgeye yakın',
    'popular': 'Yüksek etiket eşleşmesi',
}


class AIService:
    def __init__(self, route_service: RouteService, stop_service: StopService | None = None) -> None:
        self.route_service = route_service
        self.stop_service = stop_service

    @staticmethod
    def status() -> AIStatusResponse:
        return AIStatusResponse(
            llm_enabled=settings.llm_enabled,
            provider=settings.llm_provider if settings.llm_enabled else None,
            model=(
                settings.openrouter_model
                if settings.llm_provider == 'openrouter'
                else settings.gemini_model
            )
            if settings.llm_enabled
            else None,
            fallback_mode='rules' if not settings.llm_enabled else 'llm_with_rules_fallback',
        )

    async def generate_recommendations(self, payload: AIRecommendationRequest) -> list[AIRecommendationItem]:
        routes = await self.route_service.list_routes()
        if not payload.interests:
            return []

        if settings.llm_enabled:
            try:
                items = await self._llm_recommendations(payload, routes)
                if items:
                    return items
            except LLMServiceError as exc:
                logger.warning('LLM recommend failed, using rules: %s', exc)

        return self._rule_recommendations(payload, routes)

    async def _llm_recommendations(
        self, payload: AIRecommendationRequest, routes: list
    ) -> list[AIRecommendationItem]:
        catalog = [
            {
                'route_id': r.route_id,
                'title': r.title,
                'city': r.city,
                'tags': r.tags,
                'price': r.price,
                'estimated_minutes': r.estimated_minutes,
            }
            for r in routes
        ]
        system = (
            'Sen Historial-GO turizm uygulamasının rota öneri motorusun. '
            'Yalnızca geçerli JSON döndür. Şema: '
            '{"recommendations":[{"route_id":number,"score":0-1,"reason":string,'
            '"matched_tags":[string],"fits_budget":bool,"fits_duration":bool}]}'
        )
        user = (
            f'Kullanıcı ilgi alanları: {payload.interests}. '
            f'Bütçe: {payload.budget} TRY. Süre: {payload.duration_minutes} dk. '
            f'Konum: lat={payload.location_lat}, lng={payload.location_lng}. '
            f'En fazla {payload.max_results} rota seç. Mevcut rotalar: {catalog}'
        )
        data = await llm_service.complete_json(system=system, user=user)
        raw_items = data.get('recommendations', data) if isinstance(data, dict) else data
        if not isinstance(raw_items, list):
            raise LLMServiceError('recommendations listesi yok')

        valid_ids = {r.route_id for r in routes}
        results: list[AIRecommendationItem] = []
        for row in raw_items[: payload.max_results]:
            if not isinstance(row, dict):
                continue
            rid = int(row.get('route_id', 0))
            if rid not in valid_ids:
                continue
            results.append(
                AIRecommendationItem(
                    route_id=rid,
                    score=min(1.0, max(0.0, float(row.get('score', 0.5)))),
                    reason=str(row.get('reason', 'LLM önerisi'))[:500],
                    matched_tags=[str(t) for t in row.get('matched_tags', [])][:12],
                    fits_budget=bool(row.get('fits_budget', True)),
                    fits_duration=bool(row.get('fits_duration', True)),
                    source='llm',
                )
            )
        results.sort(key=lambda x: x.score, reverse=True)
        return results

    def _rule_recommendations(self, payload: AIRecommendationRequest, routes: list) -> list[AIRecommendationItem]:
        interests = {interest.lower() for interest in payload.interests}
        recommendations: list[AIRecommendationItem] = []

        for route in routes:
            route_tags = {tag.lower() for tag in route.tags}
            tag_matches = interests.intersection(route_tags)
            if not tag_matches:
                continue

            tag_score = len(tag_matches) / max(len(interests), 1)
            budget_ok = route.price <= payload.budget
            duration_ok = abs(route.estimated_minutes - payload.duration_minutes) <= max(
                60, int(payload.duration_minutes * 0.5)
            )

            score = tag_score * 0.5
            reasons: list[str] = [
                _REASON_TEMPLATES['tag'].format(tags=', '.join(sorted(tag_matches))),
            ]

            if budget_ok:
                score += 0.2
                reasons.append(_REASON_TEMPLATES['budget'].format(price=route.price))
            else:
                score -= 0.1

            if duration_ok:
                score += 0.15
                reasons.append(_REASON_TEMPLATES['duration'].format(minutes=route.estimated_minutes))

            poi = _CITY_POI.get(route.city)
            if poi and payload.location_lat and payload.location_lng:
                if is_user_near_location(
                    user_lat=payload.location_lat,
                    user_lng=payload.location_lng,
                    target_lat=poi[0],
                    target_lng=poi[1],
                    threshold_meters=5000,
                ):
                    score += 0.15
                    reasons.append(_REASON_TEMPLATES['proximity'])

            if len(tag_matches) >= 2:
                score += 0.1
                reasons.append(_REASON_TEMPLATES['popular'])

            recommendations.append(
                AIRecommendationItem(
                    route_id=route.route_id,
                    score=round(min(1.0, score), 3),
                    reason=' · '.join(reasons[:3]),
                    matched_tags=sorted(tag_matches),
                    fits_budget=budget_ok,
                    fits_duration=duration_ok,
                    source='rules',
                )
            )

        recommendations.sort(key=lambda item: item.score, reverse=True)
        return recommendations[: payload.max_results]

    async def check_geofence(self, payload: GeofenceCheckRequest) -> GeofenceCheckResponse:
        if not self.stop_service:
            return GeofenceCheckResponse(
                triggered=False,
                message='Stop service unavailable',
            )
        try:
            stops = await self.stop_service.list_stops(payload.route_id)
        except RouteNotFoundError:
            return GeofenceCheckResponse(triggered=False, message='Route not found')

        best_dist: float | None = None
        best = None
        for stop in stops:
            dist = calculate_distance_meters(
                user_lat=payload.latitude,
                user_lng=payload.longitude,
                target_lat=stop.latitude,
                target_lng=stop.longitude,
            )
            if best_dist is None or dist < best_dist:
                best_dist = dist
                best = stop

        if best is None or best_dist is None:
            return GeofenceCheckResponse(triggered=False, message='No stops on route')

        if best_dist <= payload.radius_m:
            return GeofenceCheckResponse(
                triggered=True,
                distance_m=round(best_dist, 1),
                stop_id=best.stop_id,
                stop_title=best.title,
                audio_url=best.audio_url,
                message=f'Sesli rehber tetiklendi: {best.title}',
            )
        return GeofenceCheckResponse(
            triggered=False,
            distance_m=round(best_dist, 1),
            stop_id=best.stop_id,
            stop_title=best.title,
            message=f'En yakın durak {round(best_dist, 0)} m uzakta (eşik {payload.radius_m} m)',
        )

    async def preview_narration(self, payload: StopNarrationRequest) -> StopNarrationResponse:
        if settings.llm_enabled:
            try:
                return await self._llm_narration(payload)
            except LLMServiceError as exc:
                logger.warning('LLM narration failed: %s', exc)
        return self._rule_narration(payload)

    async def _llm_narration(self, payload: StopNarrationRequest) -> StopNarrationResponse:
        langs = payload.languages or ['tr', 'en', 'de']
        system = (
            'Sen tarihî sesli rehbersin. Kısa, sıcak, doğru anlatımlar yaz. '
            'Yalnızca JSON: {"scripts":{"tr":"...","en":"...","de":"..."}} '
            'İstenen diller için anahtarları doldur.'
        )
        user = (
            f'Durak: {payload.stop_title}. Bağlam: {payload.description or "Genel tarihî bilgi"}. '
            f'Diller: {langs}. Her dilde 2-4 cümle.'
        )
        data = await llm_service.complete_json(system=system, user=user)
        scripts_raw = data.get('scripts', data) if isinstance(data, dict) else {}
        scripts: dict[str, str] = {}
        for lang in langs:
            code = lang.lower()[:2]
            text = scripts_raw.get(code) or scripts_raw.get(lang)
            if text:
                scripts[code] = str(text).strip()[:1200]
        if not scripts:
            raise LLMServiceError('Boş narration scripts')
        return StopNarrationResponse(
            stop_title=payload.stop_title,
            scripts=scripts,
            note='Anlatım OpenRouter/Gemini LLM ile üretildi.',
        )

    @staticmethod
    def _rule_narration(payload: StopNarrationRequest) -> StopNarrationResponse:
        base = payload.description.strip() or f'{payload.stop_title} hakkında kısa bir tarihî anlatım.'
        scripts: dict[str, str] = {}
        for lang in payload.languages:
            code = lang.lower()[:2]
            if code == 'en':
                scripts['en'] = f'Welcome. {base[:400]}'
            elif code == 'de':
                scripts['de'] = f'Willkommen. {base[:400]}'
            else:
                scripts['tr'] = f'Hoş geldiniz. {base[:400]}'
        return StopNarrationResponse(
            stop_title=payload.stop_title,
            scripts=scripts,
            note='Kural tabanlı önizleme (LLM anahtarı yok).',
        )

    async def narration_audio(self, payload: NarrationAudioRequest) -> NarrationAudioResponse:
        preview = await self.preview_narration(
            StopNarrationRequest(
                stop_title=payload.stop_title,
                description=payload.description,
                languages=[payload.language],
            ),
        )
        script = preview.scripts.get(payload.language) or preview.scripts.get('tr') or payload.stop_title
        audio_b64 = await synthesize_mp3_base64(script, payload.language)
        return NarrationAudioResponse(
            stop_title=payload.stop_title,
            language=payload.language,
            audio_base64=audio_b64,
            script=script,
            fallback_browser_tts=audio_b64 is None,
        )
