import logging
import time
from hashlib import sha256

from app.core.config import settings
from app.core.exceptions import RouteNotFoundError
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
    StopNarrationRequest,
    StopNarrationResponse,
)
from app.services.google_places_service import google_places_service
from app.services.assistant_intent import needs_travel_plan, quick_assistant_reply
from app.services.ai_prompts import (
    SYSTEM_ASSISTANT,
    SYSTEM_NARRATION,
    SYSTEM_ROUTE_RECOMMEND,
    build_assistant_user,
    build_narration_user,
    build_route_recommend_user,
)
from app.services.llm_service import LLMServiceError, llm_service
from app.services.tts_service import synthesize_mp3_base64
from app.services.wikipedia_service import fetch_wikipedia_summary
from app.schemas.ai_schema import NarrationSource
from app.services.route_service import RouteService
from app.services.stop_service import StopService
from app.utils.geolocation import calculate_distance_meters, is_user_near_location

logger = logging.getLogger(__name__)

_NARRATION_CACHE: dict[str, tuple[float, StopNarrationResponse]] = {}
_NARRATION_TTL_SEC = 3600


def _narration_cache_key(title: str, desc: str, langs: tuple[str, ...]) -> str:
    raw = f'{title.strip().lower()}|{desc[:600]}|{";".join(sorted(langs))}'
    return sha256(raw.encode()).hexdigest()

_CITY_POI = {
    'Istanbul': (41.0082, 28.9784),
    'Ankara': (39.9334, 32.8597),
}

_LLM_CATALOG_LIMIT = 30
_LLM_RECOMMEND_MAX_TOKENS = 700
_LLM_ASSISTANT_MAX_TOKENS = 500
_LLM_NARRATION_MAX_TOKENS = 1400


def _prefilter_routes_for_llm(routes: list, interests: list[str], limit: int = _LLM_CATALOG_LIMIT) -> list:
    """LLM'e giden token sayısını düşürmek için ilgi alanına göre ön filtre."""
    if not interests:
        return routes[:limit]
    interest_set = {i.lower().strip() for i in interests if i.strip()}
    scored: list[tuple[int, object]] = []
    for route in routes:
        tags = {t.lower() for t in route.tags}
        overlap = len(interest_set.intersection(tags))
        scored.append((overlap, route))
    scored.sort(key=lambda x: x[0], reverse=True)
    picked = [r for score, r in scored if score > 0][:limit]
    if picked:
        return picked
    return routes[:limit]


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
                else settings.huggingface_model
                if settings.llm_provider == 'huggingface'
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
        filtered = _prefilter_routes_for_llm(routes, payload.interests)
        catalog = [
            {
                'route_id': r.route_id,
                'title': r.title,
                'city': r.city,
                'tags': r.tags,
                'price': r.price,
                'estimated_minutes': r.estimated_minutes,
            }
            for r in filtered
        ]
        user = build_route_recommend_user(
            interests=payload.interests,
            budget=payload.budget,
            duration_minutes=payload.duration_minutes,
            location_lat=payload.location_lat,
            location_lng=payload.location_lng,
            max_results=payload.max_results,
            catalog=catalog,
        )
        data = await llm_service.complete_json(
            system=SYSTEM_ROUTE_RECOMMEND,
            user=user,
            temperature=0.2,
            max_tokens=_LLM_RECOMMEND_MAX_TOKENS,
        )
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
        langs = tuple(payload.languages or ['tr', 'en'])
        cache_key = _narration_cache_key(
            payload.stop_title,
            payload.description or '',
            langs,
        )
        cached = _NARRATION_CACHE.get(cache_key)
        if cached and time.time() - cached[0] < _NARRATION_TTL_SEC:
            return cached[1]

        wiki_text, wiki_sources = await fetch_wikipedia_summary(payload.stop_title)
        enriched = payload
        if wiki_text:
            desc = f'{payload.description}\n\nKaynak özeti: {wiki_text}'.strip()
            enriched = StopNarrationRequest(
                stop_title=payload.stop_title,
                description=desc[:4000],
                languages=list(langs),
            )
        sources = [NarrationSource(title=s['title'], url=s.get('url', '')) for s in wiki_sources]
        if settings.llm_enabled:
            try:
                result = await self._llm_narration(enriched)
                result.sources = sources
                _NARRATION_CACHE[cache_key] = (time.time(), result)
                return result
            except LLMServiceError as exc:
                logger.warning('LLM narration failed: %s', exc)
        result = self._rule_narration(enriched)
        result.sources = sources
        _NARRATION_CACHE[cache_key] = (time.time(), result)
        return result

    async def chat_assistant(self, payload: AssistantChatRequest) -> AssistantChatResponse:
        if not settings.llm_enabled:
            return AssistantChatResponse(
                reply=(
                    'AI asistanı şu an yapılandırılmamış. '
                    'Keşfet → İller üzerinden şehir seçip haritada canlı mekanları görebilirsin.'
                ),
                source='rules',
            )

        last_user = ''
        for msg in reversed(payload.messages):
            if msg.role == 'user' and msg.content.strip():
                last_user = msg.content.strip()
                break
        if not last_user:
            last_user = 'Merhaba'

        quick = quick_assistant_reply(last_user, payload.city, payload.district or '')
        if quick:
            return AssistantChatResponse(reply=quick, source='rules')

        interests = ', '.join(payload.interests) if payload.interests else 'genel'
        where = payload.city if not payload.district else f'{payload.district}, {payload.city}'

        places_hint = ''
        if needs_travel_plan(last_user) and settings.google_places_enabled:
            lat = payload.location_lat
            lng = payload.location_lng
            if lat is None or lng is None:
                key = payload.city.strip().lower()
                for name, coords in _CITY_POI.items():
                    if name.lower() in key or key in name.lower():
                        lat, lng = coords
                        break
                if lat is None:
                    lat, lng = 41.0082, 28.9784
            cat = _interest_to_category(payload.interests)
            try:
                nearby, _ = await google_places_service.search_nearby(
                    lat=float(lat),
                    lng=float(lng),
                    radius_m=8000,
                    category=cat,
                )
                if nearby:
                    names = ', '.join(p.name for p in nearby[:10])
                    places_hint = names
            except Exception as exc:
                logger.debug('Assistant places lookup: %s', exc)

        user = build_assistant_user(
            where=where,
            interests=interests,
            places_hint=places_hint,
            user_message=last_user,
        )
        text = await llm_service.complete_text(
            system=SYSTEM_ASSISTANT,
            user=user,
            temperature=0.35,
            max_tokens=_LLM_ASSISTANT_MAX_TOKENS,
        )
        return AssistantChatResponse(reply=text.strip()[:2500], source='llm')

    async def _llm_narration(self, payload: StopNarrationRequest) -> StopNarrationResponse:
        langs = payload.languages or ['tr', 'en', 'de']
        user = build_narration_user(
            stop_title=payload.stop_title,
            description=payload.description or '',
            languages=langs,
        )
        data = await llm_service.complete_json(
            system=SYSTEM_NARRATION,
            user=user,
            temperature=0.35,
            max_tokens=_LLM_NARRATION_MAX_TOKENS,
        )
        scripts_raw = data.get('scripts', data) if isinstance(data, dict) else {}
        scripts: dict[str, str] = {}
        for lang in langs:
            code = lang.lower()[:2]
            text = scripts_raw.get(code) or scripts_raw.get(lang)
            if text:
                scripts[code] = str(text).strip()[:2500]
        if not scripts:
            raise LLMServiceError('Boş narration scripts')
        return StopNarrationResponse(
            stop_title=payload.stop_title,
            scripts=scripts,
            note='',
        )

    @staticmethod
    def _rule_narration(payload: StopNarrationRequest) -> StopNarrationResponse:
        title = payload.stop_title.strip()
        base = (payload.description or '').strip()
        if not base:
            base = f'{title} Türkiye\'nin önemli kültür ve gezi noktalarından biridir.'
        scripts: dict[str, str] = {}
        for lang in payload.languages:
            code = lang.lower()[:2]
            if code == 'en':
                scripts['en'] = (
                    f'You are visiting {title}. {base[:900]} '
                    'Take your time to explore the surroundings and check opening hours before you go.'
                )
            elif code == 'de':
                scripts['de'] = f'Sie besuchen {title}. {base[:900]}'
            else:
                scripts['tr'] = (
                    f'{title} noktasındasınız. {base[:900]} '
                    'Çevreyi keşfederken ziyaret saatlerini kontrol etmeyi unutmayın.'
                )
        return StopNarrationResponse(
            stop_title=payload.stop_title,
            scripts=scripts,
            note='',
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
            sources=preview.sources,
        )


def _interest_to_category(interests: list[str]) -> str | None:
    joined = ' '.join(interests).lower()
    if any(w in joined for w in ('food', 'yemek', 'restaurant', 'cafe')):
        return 'restaurant'
    if any(w in joined for w in ('hotel', 'konak', 'lodging', 'stay')):
        return 'accommodation'
    if any(w in joined for w in ('museum', 'müze', 'art')):
        return 'museum'
    if any(w in joined for w in ('mosque', 'cami')):
        return 'mosque'
    if any(w in joined for w in ('palace', 'saray')):
        return 'palace'
    return 'historical'
