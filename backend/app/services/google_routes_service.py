"""Google Routes API v2 — compute route for in-app directions."""

from __future__ import annotations

import logging

import httpx

from app.core.config import settings
from app.schemas.google_schema import ComputeRouteResponse, RouteStep

logger = logging.getLogger(__name__)


def _routes_key() -> str:
    key = settings.google_routes_api_key.strip() or settings.google_places_api_key.strip()
    if not key:
        raise ValueError('GOOGLE_ROUTES_API_KEY veya GOOGLE_PLACES_API_KEY yapılandırılmamış')
    return key


def google_routes_enabled() -> bool:
    return bool(
        settings.google_routes_api_key.strip() or settings.google_places_api_key.strip()
    )


class GoogleRoutesService:
    async def compute_route(
        self,
        *,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        travel_mode: str = 'WALK',
        waypoints: list[tuple[float, float]] | None = None,
    ) -> ComputeRouteResponse:
        if not google_routes_enabled:
            raise ValueError('Google Routes API anahtarı yapılandırılmamış')

        body: dict = {
            'origin': {
                'location': {'latLng': {'latitude': origin_lat, 'longitude': origin_lng}},
            },
            'destination': {
                'location': {'latLng': {'latitude': dest_lat, 'longitude': dest_lng}},
            },
            'travelMode': travel_mode,
            'languageCode': 'tr',
            'units': 'METRIC',
        }
        if waypoints:
            body['intermediates'] = [
                {'location': {'latLng': {'latitude': lat, 'longitude': lng}}}
                for lat, lng in waypoints[:8]
            ]
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': _routes_key(),
            'X-Goog-FieldMask': (
                'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,'
                'routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,'
                'routes.legs.steps.staticDuration'
            ),
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                'https://routes.googleapis.com/directions/v2:computeRoutes',
                json=body,
                headers=headers,
            )
        if resp.status_code >= 400:
            logger.warning('Routes API %s: %s', resp.status_code, resp.text[:300])
            raise ValueError('Rota hesaplanamadı')

        data = resp.json()
        routes = data.get('routes') or []
        if not routes:
            raise ValueError('Rota bulunamadı')

        route = routes[0]
        encoded = ''
        poly = route.get('polyline') or {}
        if isinstance(poly, dict):
            encoded = str(poly.get('encodedPolyline', ''))

        steps: list[RouteStep] = []
        for leg in route.get('legs') or []:
            for step in leg.get('steps') or []:
                nav = step.get('navigationInstruction') or {}
                instr = ''
                if isinstance(nav, dict):
                    instr = str(nav.get('instructions', ''))
                dist = float(step.get('distanceMeters') or 0)
                dur_s = 0
                sd = step.get('staticDuration')
                if isinstance(sd, str) and sd.endswith('s'):
                    try:
                        dur_s = int(float(sd.rstrip('s')))
                    except ValueError:
                        dur_s = 0
                steps.append(
                    RouteStep(
                        instruction=instr,
                        distance_m=dist,
                        duration_s=dur_s,
                    )
                )

        duration_s = 0
        dur = route.get('duration')
        if isinstance(dur, str) and dur.endswith('s'):
            try:
                duration_s = int(float(dur.rstrip('s')))
            except ValueError:
                duration_s = 0

        return ComputeRouteResponse(
            encoded_polyline=encoded,
            distance_m=float(route.get('distanceMeters') or 0),
            duration_s=duration_s,
            steps=steps,
        )


google_routes_service = GoogleRoutesService()
