from datetime import datetime

from app.core.exceptions import RouteNotFoundError
from app.models.moderation_model import ContentReport, ModerationDecision
from app.models.route_model import Route
from app.repositories.content_report_repository import ContentReportRepository
from app.repositories.moderation_decision_repository import ModerationDecisionRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.stop_repository import StopRepository
from app.repositories.user_repository import UserRepository
from app.schemas.moderation_schema import (
    AdminPendingRoute,
    ContentReportCreate,
    ContentReportResolve,
    ContentReportResponse,
    RouteModerationDecision,
)
from app.schemas.route_schema import RouteResponse
from app.services.route_service import RouteService
from app.utils.time import utc_now


class ModerationService:
    def __init__(
        self,
        routes: RouteRepository,
        stops: StopRepository,
        reports: ContentReportRepository,
        users: UserRepository,
        route_service: RouteService,
        decisions: ModerationDecisionRepository,
    ) -> None:
        self.routes = routes
        self.stops = stops
        self.reports = reports
        self.users = users
        self.route_service = route_service
        self.decisions = decisions

    async def list_pending_routes(self) -> list[AdminPendingRoute]:
        rows = await self.routes.list_by_status('in_review')
        return [
            AdminPendingRoute(
                route_id=r.route_id,
                title=r.title,
                city=r.city,
                guide_id=r.guide_id,
                status=r.status,
                price=r.price,
                estimated_minutes=r.estimated_minutes,
                submitted_at=r.submitted_at.isoformat() if r.submitted_at else None,
            )
            for r in rows
        ]

    async def moderate_route(
        self,
        route_id: int,
        admin_id: int,
        payload: RouteModerationDecision,
    ) -> RouteResponse:
        route = await self.routes.get_by_id(route_id)
        if not route:
            raise RouteNotFoundError(route_id)

        action = payload.action
        if action == 'approve':
            if route.status != 'in_review':
                raise ValueError('Route is not awaiting review')
            route.status = 'approved'
            route.moderation_note = ''
        elif action == 'reject':
            route.status = 'changes_requested'
            route.moderation_note = payload.public_feedback.strip()
        elif action == 'unpublish':
            route.status = 'unpublished'
            route.moderation_note = payload.public_feedback.strip() or route.moderation_note
        else:
            raise ValueError('Invalid action')

        await self.routes.save(route)
        decision = ModerationDecision(
            entity_type='route',
            entity_id=route_id,
            admin_id=admin_id,
            action=action,
            reason_codes=payload.reason_codes,
            public_feedback=payload.public_feedback,
            created_at=utc_now(),
        )
        await self.decisions.create(decision)
        return self.route_service._to_response(route)

    async def submit_route_for_review(self, route_id: int, guide_id: int) -> RouteResponse:
        route = await self._get_owned_route(route_id, guide_id)
        if route.status not in ('draft', 'changes_requested'):
            raise ValueError('Route cannot be submitted in current status')
        stops = await self.stops.list_by_route(route_id)
        if not stops:
            raise ValueError('Add at least one stop before submitting')
        if route.price < 0:
            raise ValueError('Price must be set')

        route.status = 'in_review'
        route.submitted_at = utc_now()
        await self.routes.save(route)
        return self.route_service._to_response(route)

    async def publish_route(self, route_id: int, guide_id: int) -> RouteResponse:
        route = await self._get_owned_route(route_id, guide_id)
        if route.status != 'approved':
            raise ValueError('Route must be approved before publishing')
        route.status = 'published'
        route.published_at = utc_now()
        await self.routes.save(route)
        return self.route_service._to_response(route)

    async def _get_owned_route(self, route_id: int, guide_id: int) -> Route:
        route = await self.routes.get_by_id(route_id)
        if not route or route.guide_id != guide_id:
            raise RouteNotFoundError(route_id)
        return route

    async def create_report(self, reporter_id: int, payload: ContentReportCreate) -> ContentReportResponse:
        report = ContentReport(
            reporter_user_id=reporter_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            reason=payload.reason,
            details=payload.details,
            status='open',
            created_at=utc_now(),
        )
        created = await self.reports.create(report)
        return self._report_response(created)

    async def list_open_reports(self) -> list[ContentReportResponse]:
        rows = await self.reports.list_open()
        return [self._report_response(r) for r in rows]

    async def resolve_report(
        self,
        report_id: int,
        admin_id: int,
        payload: ContentReportResolve,
    ) -> ContentReportResponse:
        report = await self.reports.get_by_id(report_id)
        if not report:
            raise ValueError('Report not found')
        report.status = payload.status
        report.admin_id = admin_id
        report.resolved_at = utc_now()
        saved = await self.reports.save(report)
        return self._report_response(saved)

    @staticmethod
    def _report_response(report: ContentReport) -> ContentReportResponse:
        return ContentReportResponse(
            report_id=report.report_id,
            entity_type=report.entity_type,
            entity_id=report.entity_id,
            reason=report.reason,
            details=report.details,
            status=report.status,
            created_at=report.created_at.isoformat(),
        )
