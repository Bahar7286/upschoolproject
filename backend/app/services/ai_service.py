from app.schemas.ai_schema import AIRecommendationItem, AIRecommendationRequest
from app.services.route_service import RouteService
from app.utils.geolocation import is_user_near_location

# Minimal static POIs for geofence-aware ranking.
_CITY_POI = {
    'Istanbul': (41.0082, 28.9784),
    'Ankara': (39.9334, 32.8597),
}


class AIService:
    def __init__(self, route_service: RouteService) -> None:
        self.route_service = route_service

    async def generate_recommendations(self, payload: AIRecommendationRequest) -> list[AIRecommendationItem]:
        routes = await self.route_service.list_routes()
        if not payload.interests:
            return []

        interests = {interest.lower() for interest in payload.interests}
        recommendations: list[AIRecommendationItem] = []

        for route in routes:
            tag_matches = len(interests.intersection({tag.lower() for tag in route.tags}))
            if tag_matches == 0:
                continue

            poi = _CITY_POI.get(route.city)
            proximity_boost = 0.15
            if poi:
                near_city_center = is_user_near_location(
                    user_lat=payload.location_lat,
                    user_lng=payload.location_lng,
                    target_lat=poi[0],
                    target_lng=poi[1],
                    threshold_meters=3000,
                )
                proximity_boost = 0.3 if near_city_center else 0.1

            score = min(1.0, (tag_matches / max(len(interests), 1)) + proximity_boost)
            recommendations.append(
                AIRecommendationItem(
                    route_id=route.route_id,
                    score=round(score, 3),
                    reason='Matched interests and nearby city context',
                )
            )

        recommendations.sort(key=lambda item: item.score, reverse=True)
        return recommendations[: payload.max_results]
