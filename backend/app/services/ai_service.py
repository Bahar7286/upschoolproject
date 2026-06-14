import asyncio
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
    PersonalRouteGenerateRequest,
    PersonalRouteGenerateResponse,
    PersonalRouteStop,
    StopNarrationRequest,
    StopNarrationResponse,
)
from app.services.google_places_service import google_places_service
from app.services.assistant_intent import (
    build_conversation_history,
    detect_query_category,
    district_coords,
    extract_area_from_messages,
    extract_city_from_messages,
    extract_trip_params,
    is_food_query,
    needs_travel_plan,
    quick_assistant_reply,
    resolve_intent,
)
from app.services.ai_prompts import (
    SYSTEM_ASSISTANT,
    SYSTEM_ASSISTANT_VENUE,
    SYSTEM_NARRATION,
    SYSTEM_PERSONAL_ROUTE,
    SYSTEM_ROUTE_RECOMMEND,
    build_assistant_user,
    build_narration_user,
    build_personal_route_user,
    build_route_recommend_user,
    format_itinerary_reply,
    format_places_detail,
    format_places_reply,
    format_venue_reply,
)
from app.services.llm_service import LLMServiceError, llm_service
from app.services.tts_service import synthesize_mp3_base64
from app.services.wikipedia_service import fetch_wikipedia_summary
from app.schemas.ai_schema import NarrationSource
from app.repositories.place_repository import PlaceRepository
from app.services.route_service import RouteService
from app.services.stop_service import StopService
from app.utils.district_filter import filter_by_city, filter_by_district
from app.utils.places_quality import dedupe_places, filter_quality_places
from app.data.city_landmarks import city_landmark_places
from app.utils.city_coords import haversine_km, resolve_city_coords
from app.utils.geolocation import calculate_distance_meters, is_user_near_location

logger = logging.getLogger(__name__)

_NARRATION_CACHE: dict[str, tuple[float, StopNarrationResponse]] = {}
_NARRATION_TTL_SEC = 3600


def _narration_cache_key(title: str, desc: str, langs: tuple[str, ...]) -> str:
    raw = f'{title.strip().lower()}|{desc[:600]}|{";".join(sorted(langs))}'
    return sha256(raw.encode()).hexdigest()

_CITY_POI = {
    'istanbul': (41.0082, 28.9784),
    'İstanbul': (41.0082, 28.9784),
    'ankara': (39.9334, 32.8597),
    'Ankara': (39.9334, 32.8597),
    'izmir': (38.4192, 27.1287),
    'antalya': (36.8969, 30.7133),
    'bursa': (40.1885, 29.0610),
    'gaziantep': (37.0662, 37.3833),
    'trabzon': (41.0027, 39.7168),
    'konya': (37.8746, 32.4932),
    'duzce': (40.8438, 31.1565),
    'düzce': (40.8438, 31.1565),
}

_LLM_RECOMMEND_TIMEOUT_SEC = 12.0

_LLM_CATALOG_LIMIT = 30
_LLM_RECOMMEND_MAX_TOKENS = 700
_LLM_ASSISTANT_MAX_TOKENS = 500
_LLM_ASSISTANT_TIMEOUT_SEC = 28.0
_LLM_NARRATION_MAX_TOKENS = 1400
_LLM_PERSONAL_ROUTE_TIMEOUT_SEC = 45.0
_LLM_PERSONAL_ROUTE_MAX_TOKENS = 1200


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
    def __init__(
        self,
        route_service: RouteService,
        stop_service: StopService | None = None,
        place_repository: PlaceRepository | None = None,
    ) -> None:
        self.route_service = route_service
        self.stop_service = stop_service
        self.place_repository = place_repository

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
                items = await asyncio.wait_for(
                    self._llm_recommendations(payload, routes),
                    timeout=_LLM_RECOMMEND_TIMEOUT_SEC,
                )
                if items:
                    return items
            except asyncio.TimeoutError:
                logger.warning('LLM recommend timeout (%.0fs), using rules', _LLM_RECOMMEND_TIMEOUT_SEC)
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

    async def generate_personal_route(
        self, payload: PersonalRouteGenerateRequest
    ) -> PersonalRouteGenerateResponse:
        try:
            lat, lng = self._resolve_generate_coords(payload)
        except ValueError:
            return PersonalRouteGenerateResponse(
                title=f'{payload.city} gezi planı',
                summary='Seçilen il için konum bilgisi bulunamadı. Lütfen geçerli bir il seçin.',
                city=payload.city,
                district=payload.district,
                total_minutes=0,
                estimated_cost=0,
                stops=[],
                source='rules',
            )
        candidates = await self._collect_route_candidates(payload, lat, lng)
        if not candidates:
            area = f'{payload.district}, {payload.city}' if payload.district else payload.city
            return PersonalRouteGenerateResponse(
                title=f'{area} gezi planı',
                summary=(
                    'Bu bölge için henüz yeterli mekan verisi yok. '
                    'İller sekmesinden başka bir ilçe deneyebilir veya Harita sekmesini kullanabilirsin.'
                ),
                city=payload.city,
                district=payload.district,
                total_minutes=0,
                estimated_cost=0,
                stops=[],
                source='rules',
            )

        if settings.llm_enabled:
            try:
                result = await asyncio.wait_for(
                    self._llm_personal_route(payload, candidates),
                    timeout=_LLM_PERSONAL_ROUTE_TIMEOUT_SEC,
                )
                if result.stops:
                    return result
            except (asyncio.TimeoutError, LLMServiceError) as exc:
                logger.warning('Personal route LLM failed, rules fallback: %s', exc)

        return self._rule_personal_route(payload, candidates)

    async def _collect_route_candidates(
        self, payload: PersonalRouteGenerateRequest, lat: float, lng: float
    ) -> list[dict[str, object]]:
        seen: set[str] = set()
        out: list[dict[str, object]] = []
        max_km = 10.0 if payload.district.strip() else 35.0

        def accept_candidate(plat: float, plng: float, address: str = '') -> bool:
            dist = haversine_km(lat, lng, plat, plng)
            if dist > max_km:
                return False
            if payload.district.strip():
                from app.utils.district_filter import address_matches_district

                return address_matches_district(address, payload.district) or dist <= 8.0
            from app.utils.district_filter import address_matches_city

            if address and address_matches_city(address, payload.city):
                return True
            return dist <= 25.0

        def add(
            cid: str,
            name: str,
            plat: float,
            plng: float,
            category: str,
            desc: str = '',
            place_id: int | None = None,
        ) -> None:
            key = cid.lower()
            if key in seen:
                return
            seen.add(key)
            out.append(
                {
                    'candidate_id': cid,
                    'name': name,
                    'lat': plat,
                    'lng': plng,
                    'category': category,
                    'description': (desc or '')[:200],
                    'place_id': place_id,
                }
            )

        if self.place_repository:
            db_places = await self.place_repository.list_places(
                city=payload.city,
                district=payload.district or None,
                limit=80,
            )
            for p in db_places:
                addr = f'{p.district} {p.city}'
                if payload.district.strip() and not accept_candidate(p.latitude, p.longitude, addr):
                    continue
                add(f'db-{p.place_id}', p.name, p.latitude, p.longitude, p.category, p.description, p.place_id)

        if settings.google_places_enabled:
            cat = _interest_to_category(payload.interests)
            radius = 4000 if payload.district.strip() else 25000
            google_places: list = []
            try:
                google_places, _ = await google_places_service.search_nearby(
                    lat=lat, lng=lng, radius_m=radius, category=cat or 'historical'
                )
                if payload.district.strip():
                    google_places = filter_by_district(google_places, payload.district)
                else:
                    google_places = filter_by_city(google_places, payload.city)
                google_places = [
                    gp
                    for gp in google_places
                    if accept_candidate(
                        float(getattr(gp, 'lat', lat)),
                        float(getattr(gp, 'lng', lng)),
                        getattr(gp, 'address', '') or '',
                    )
                ]
            except Exception as exc:
                logger.debug('Personal route Google nearby: %s', exc)

            if len(google_places) < 3:
                for query in (
                    f'turistik yerler {payload.city}',
                    f'müze {payload.city}',
                    f'tarihi yer {payload.city}',
                ):
                    try:
                        text_places, _ = await google_places_service.search_text(
                            query=query,
                            lat=lat,
                            lng=lng,
                            radius_m=35000,
                            client_key='personal-route',
                        )
                        batch = filter_by_city(text_places, payload.city)
                        for gp in batch:
                            if accept_candidate(
                                float(getattr(gp, 'lat', lat)),
                                float(getattr(gp, 'lng', lng)),
                                getattr(gp, 'address', '') or '',
                            ):
                                google_places.append(gp)
                    except Exception as exc:
                        logger.debug('Personal route Google text: %s', exc)

            for gp in google_places[:25]:
                gid = getattr(gp, 'place_id', '') or getattr(gp, 'name', '')
                add(
                    f'g-{gid}',
                    getattr(gp, 'name', ''),
                    float(getattr(gp, 'lat', lat)),
                    float(getattr(gp, 'lng', lng)),
                    cat or 'historical',
                    getattr(gp, 'address', ''),
                )

        return out[:40]

    async def _llm_personal_route(
        self, payload: PersonalRouteGenerateRequest, candidates: list[dict[str, object]]
    ) -> PersonalRouteGenerateResponse:
        user = build_personal_route_user(
            city=payload.city,
            district=payload.district,
            interests=payload.interests,
            budget=payload.budget,
            duration_minutes=payload.duration_minutes,
            max_stops=payload.max_stops,
            language=payload.preferred_language,
            candidates=candidates,
        )
        data = await llm_service.complete_json(
            system=SYSTEM_PERSONAL_ROUTE,
            user=user,
            temperature=0.25,
            max_tokens=_LLM_PERSONAL_ROUTE_MAX_TOKENS,
        )
        by_id = {str(c['candidate_id']): c for c in candidates}
        raw_stops = data.get('stops', []) if isinstance(data, dict) else []
        stops: list[PersonalRouteStop] = []
        total_dwell = 0
        for row in raw_stops[: payload.max_stops]:
            if not isinstance(row, dict):
                continue
            cid = str(row.get('candidate_id', ''))
            cand = by_id.get(cid)
            if not cand:
                continue
            dwell = min(120, max(15, int(row.get('dwell_minutes', 30))))
            if total_dwell + dwell > payload.duration_minutes + 30:
                break
            total_dwell += dwell
            stops.append(
                PersonalRouteStop(
                    order=len(stops) + 1,
                    name=str(cand['name']),
                    lat=float(cand['lat']),
                    lng=float(cand['lng']),
                    category=str(cand.get('category', '')),
                    reason=str(row.get('reason', ''))[:500],
                    dwell_minutes=dwell,
                    place_id=cand.get('place_id'),
                    narration_snippet=str(row.get('narration_snippet', ''))[:600],
                )
            )
        area = f'{payload.district}, {payload.city}' if payload.district else payload.city
        return PersonalRouteGenerateResponse(
            title=str(data.get('title', f'{area} kişisel rotası'))[:180],
            summary=str(data.get('summary', ''))[:1200],
            city=payload.city,
            district=payload.district,
            total_minutes=int(data.get('total_minutes', total_dwell)) or total_dwell,
            estimated_cost=min(float(payload.budget), float(data.get('estimated_cost', payload.budget * 0.6))),
            stops=stops,
            source='llm',
        )

    def _rule_personal_route(
        self, payload: PersonalRouteGenerateRequest, candidates: list[dict[str, object]]
    ) -> PersonalRouteGenerateResponse:
        interest_set = {i.lower() for i in payload.interests}
        scored: list[tuple[float, dict[str, object]]] = []
        for c in candidates:
            cat = str(c.get('category', '')).lower()
            tags = str(c.get('description', '')).lower()
            score = 0.0
            for interest in interest_set:
                if interest in cat or interest in tags:
                    score += 1.0
            if 'food' in interest_set or 'gastronomy' in interest_set:
                if cat == 'restaurant':
                    score += 2.0
            if 'history' in interest_set and cat in ('historical', 'museum', 'mosque', 'palace'):
                score += 1.5
            scored.append((score, c))
        scored.sort(key=lambda x: x[0], reverse=True)
        dwell_each = max(20, payload.duration_minutes // max(payload.max_stops, 2))
        stops: list[PersonalRouteStop] = []
        for _, cand in scored[: payload.max_stops]:
            stops.append(
                PersonalRouteStop(
                    order=len(stops) + 1,
                    name=str(cand['name']),
                    lat=float(cand['lat']),
                    lng=float(cand['lng']),
                    category=str(cand.get('category', '')),
                    reason='İlgi alanlarına uygun durak',
                    dwell_minutes=dwell_each,
                    place_id=cand.get('place_id'),
                    narration_snippet=str(cand.get('description', ''))[:300],
                )
            )
        area = f'{payload.district}, {payload.city}' if payload.district else payload.city
        lang = payload.preferred_language
        if lang == 'en':
            summary = f'A {payload.duration_minutes}-minute walk covering {len(stops)} stops in {area}.'
            title = f'Personal route — {area}'
        else:
            summary = (
                f'{area} için {len(stops)} duraklı, yaklaşık {payload.duration_minutes} dakikalık '
                f'kişisel gezi planı.'
            )
            title = f'Kişisel rota — {area}'
        return PersonalRouteGenerateResponse(
            title=title,
            summary=summary,
            city=payload.city,
            district=payload.district,
            total_minutes=dwell_each * len(stops),
            estimated_cost=round(min(payload.budget, len(stops) * 25.0), 2),
            stops=stops,
            source='rules',
        )

    @staticmethod
    def _resolve_generate_coords(payload: PersonalRouteGenerateRequest) -> tuple[float, float]:
        if payload.location_lat is not None and payload.location_lng is not None:
            return float(payload.location_lat), float(payload.location_lng)
        dc = district_coords(payload.district)
        if dc:
            return dc
        resolved = resolve_city_coords(payload.city)
        if resolved:
            return resolved
        key = payload.city.strip().lower()
        for name, coords in _CITY_POI.items():
            if name.lower() in key or key in name.lower():
                return coords
        raise ValueError(f'İl koordinatı bulunamadı: {payload.city}')

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
        recent_user = ''
        for msg in reversed(payload.messages):
            if msg.role == 'user' and msg.content.strip():
                if not last_user:
                    last_user = msg.content.strip()
                elif not recent_user:
                    recent_user = msg.content.strip()
                    break
        if not last_user:
            last_user = 'Merhaba'

        resolved_city = extract_city_from_messages(payload.messages, payload.city)
        area = extract_area_from_messages(payload.messages, resolved_city, payload.district)
        where = resolved_city if not area else f'{area}, {resolved_city}'

        quick = quick_assistant_reply(last_user, resolved_city, area or payload.district)
        if quick:
            return AssistantChatResponse(reply=quick, source='rules')

        interests = ', '.join(payload.interests) if payload.interests else 'genel'
        history = build_conversation_history(payload.messages)
        intent = resolve_intent(last_user, recent_user)
        lat, lng = self._resolve_assistant_coords(payload, area, resolved_city)

        if intent in ('specific_venue', 'food') and settings.google_places_enabled:
            venue_reply = await self._assistant_food_reply(
                lat=lat,
                lng=lng,
                where=where,
                last_user=last_user,
                intent=intent,
                locale=payload.preferred_language,
                city=resolved_city,
            )
            if venue_reply:
                return venue_reply

        places_hint = ''
        places_formatted_reply = ''
        if needs_travel_plan(last_user) and settings.google_places_enabled:
            days, budget = extract_trip_params(last_user)
            cat = detect_query_category(last_user, payload.interests)
            picks = await self._assistant_collect_places(
                city=resolved_city,
                lat=float(lat),
                lng=float(lng),
                category=cat,
            )
            if picks:
                places_hint = format_places_detail(picks)
                if days and days >= 2:
                    places_formatted_reply = format_itinerary_reply(
                        picks,
                        resolved_city,
                        days=days,
                        budget=budget,
                        locale=payload.preferred_language,
                    )
                else:
                    places_formatted_reply = format_places_reply(
                        picks[:8],
                        resolved_city,
                        days=days,
                        budget=budget,
                        locale=payload.preferred_language,
                    )

            if intent == 'route_plan' and places_formatted_reply.strip():
                return AssistantChatResponse(
                    reply=places_formatted_reply.strip(),
                    source='places',
                )

        prompt_intent = 'rota' if intent == 'route_plan' else intent
        user = build_assistant_user(
            where=where,
            interests=interests,
            places_hint=places_hint,
            user_message=last_user,
            intent=prompt_intent,
            history=history,
        )
        system = SYSTEM_ASSISTANT_VENUE if intent == 'food' else SYSTEM_ASSISTANT
        try:
            text = await asyncio.wait_for(
                llm_service.complete_text(
                    system=system,
                    user=user,
                    temperature=0.3,
                    max_tokens=_LLM_ASSISTANT_MAX_TOKENS,
                ),
                timeout=_LLM_ASSISTANT_TIMEOUT_SEC,
            )
            return AssistantChatResponse(reply=text.strip()[:2500], source='llm')
        except (asyncio.TimeoutError, LLMServiceError) as exc:
            logger.warning('Assistant LLM failed, rules fallback: %s', exc)
            return self._assistant_rules_fallback(
                where=where,
                last_user=last_user,
                places_formatted_reply=places_formatted_reply,
            )

    @staticmethod
    def _assistant_rules_fallback(
        *,
        where: str,
        last_user: str,
        places_formatted_reply: str = '',
    ) -> AssistantChatResponse:
        if places_formatted_reply.strip():
            return AssistantChatResponse(reply=places_formatted_reply.strip(), source='rules')
        return AssistantChatResponse(
            reply=(
                f'Şu an AI yanıtı gecikiyor; kısa özet: {where} bölgesinde gezi planı için '
                f'**Keşfet** ve **Harita** sekmelerinden rotaları inceleyebilirsin. '
                f'Sorun: "{last_user[:80]}" — birkaç dakika sonra tekrar dene.'
            ),
            source='rules',
        )

    async def _assistant_food_reply(
        self,
        *,
        lat: float,
        lng: float,
        where: str,
        last_user: str,
        intent: str,
        locale: str = 'tr',
        city: str = '',
    ) -> AssistantChatResponse | None:
        query = f'restoran {where}'
        lower = last_user.lower()
        if 'balık' in lower or 'balik' in lower:
            query = f'balık restoranı {where}'
        elif 'kebap' in lower:
            query = f'kebap {where}'

        places: list = []
        try:
            places, _ = await google_places_service.search_text(
                query=query, lat=lat, lng=lng, radius_m=4000, client_key='assistant'
            )
        except Exception as exc:
            logger.debug('Assistant text search: %s', exc)

        if not places:
            try:
                places, _ = await google_places_service.search_nearby(
                    lat=lat, lng=lng, radius_m=2500, category='restaurant', client_key='assistant'
                )
            except Exception as exc:
                logger.debug('Assistant nearby food: %s', exc)

        area_district = where.split(',')[0].strip() if ',' in where else ''
        if area_district:
            places = filter_by_district(places, area_district)
        elif city.strip():
            places = filter_by_city(places, city)

        if not places:
            return None

        if intent == 'specific_venue' or is_food_query(last_user):
            return AssistantChatResponse(
                reply=format_venue_reply(places, where, locale=locale),
                source='places',
            )
        return None

    async def _assistant_collect_places(
        self,
        *,
        city: str,
        lat: float,
        lng: float,
        category: str,
    ) -> list:
        merged: dict[str, object] = {}

        def absorb(items: list) -> None:
            for place in filter_quality_places(items, city):
                pid = str(getattr(place, 'place_id', '') or getattr(place, 'name', ''))
                merged[pid] = place

        try:
            nearby, _ = await google_places_service.search_nearby(
                lat=lat,
                lng=lng,
                radius_m=12000,
                category=category,
                client_key='assistant',
            )
            city_nearby = filter_by_city(nearby, city) or nearby
            absorb(city_nearby)
        except Exception as exc:
            logger.debug('Assistant nearby: %s', exc)

        for query in (
            f'müze {city}',
            f'tarihi yerler {city}',
            f'turistik mekanlar {city}',
            f'cami {city}',
        ):
            if len(merged) >= 12:
                break
            try:
                found, _ = await google_places_service.search_text(
                    query=query,
                    lat=lat,
                    lng=lng,
                    radius_m=20000,
                    client_key='assistant',
                )
                city_found = filter_by_city(found, city) or found
                absorb(city_found)
            except Exception as exc:
                logger.debug('Assistant text search %s: %s', query, exc)

        if len(merged) < 3 and self.place_repository:
            try:
                db_places = await self.place_repository.list_places(city=city, limit=20)
                for p in db_places:
                    from app.schemas.google_schema import GooglePlaceSummary

                    absorb([
                        GooglePlaceSummary(
                            place_id=f'db-{p.place_id}',
                            name=p.name,
                            lat=p.latitude,
                            lng=p.longitude,
                            address=f'{p.district}, {p.city}',
                            category=p.category,
                            types=['tourist_attraction'],
                        )
                    ])
            except Exception as exc:
                logger.debug('Assistant DB places: %s', exc)

        if len(merged) < 2:
            absorb(city_landmark_places(city))

        ranked = dedupe_places(list(merged.values()))
        ranked.sort(
            key=lambda p: (
                getattr(p, 'user_rating_count', None) or 0,
                getattr(p, 'rating', None) or 0.0,
            ),
            reverse=True,
        )
        return ranked[:12]

    @staticmethod
    def _resolve_assistant_coords(
        payload: AssistantChatRequest,
        area: str,
        resolved_city: str,
    ) -> tuple[float, float]:
        dc = district_coords(area)
        if dc:
            return dc
        coords = resolve_city_coords(resolved_city)
        if coords:
            return coords
        key = resolved_city.strip().lower()
        for name, city_coords in _CITY_POI.items():
            if name.lower() in key or key in name.lower():
                return city_coords
        if payload.location_lat is not None and payload.location_lng is not None:
            return float(payload.location_lat), float(payload.location_lng)
        return 39.9208, 32.8541  # Ankara — nötr merkez, İstanbul varsayımı yok

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
