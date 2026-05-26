from app.core.exceptions import ReviewAlreadyExistsError, ReviewNotFoundError
from app.models.review_model import RouteReview
from app.repositories.review_repository import ReviewRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review_schema import ReviewCreate, ReviewResponse, ReviewSummary, ReviewUpdate


class ReviewService:
    def __init__(
        self,
        review_repository: ReviewRepository,
        user_repository: UserRepository,
    ) -> None:
        self.reviews = review_repository
        self.users = user_repository

    async def _author_name(self, user_id: int) -> str:
        user = await self.users.get_by_id(user_id)
        return user.full_name if user else 'Anonim'

    async def _to_response(self, review: RouteReview) -> ReviewResponse:
        return ReviewResponse(
            review_id=review.review_id,
            user_id=review.user_id,
            route_id=review.route_id,
            author_name=await self._author_name(review.user_id),
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at.isoformat(),
        )

    async def list_reviews(self, route_id: int) -> list[ReviewResponse]:
        items = await self.reviews.list_by_route(route_id)
        return [await self._to_response(r) for r in items]

    async def get_summary(self, route_id: int) -> ReviewSummary:
        avg_rating, count = await self.reviews.summary(route_id)
        return ReviewSummary(
            average_rating=round(avg_rating, 1),
            review_count=count,
        )

    async def create_review(
        self,
        user_id: int,
        route_id: int,
        payload: ReviewCreate,
    ) -> ReviewResponse:
        if await self.reviews.get_by_user_route(user_id, route_id):
            raise ReviewAlreadyExistsError(route_id, user_id)

        review = RouteReview(
            user_id=user_id,
            route_id=route_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        created = await self.reviews.create(review)
        return await self._to_response(created)

    async def update_review(
        self,
        review_id: int,
        user_id: int,
        route_id: int,
        payload: ReviewUpdate,
    ) -> ReviewResponse:
        review = await self.reviews.get_by_id(review_id)
        if not review or review.user_id != user_id or review.route_id != route_id:
            raise ReviewNotFoundError(review_id)

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return await self._to_response(review)

        updated = await self.reviews.update_fields(review, data)
        return await self._to_response(updated)

    async def delete_review(self, review_id: int, user_id: int, route_id: int) -> None:
        review = await self.reviews.get_by_id(review_id)
        if not review or review.user_id != user_id or review.route_id != route_id:
            raise ReviewNotFoundError(review_id)
        await self.reviews.delete(review)
