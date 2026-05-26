"""Domain katmanı istisnaları — router HTTP kodlarına çevirir."""


class DomainError(Exception):
    """Tüm iş kuralı hatalarının tabanı."""


class UserNotFoundError(DomainError):
    def __init__(self, user_id: int | None = None, email: str | None = None) -> None:
        self.user_id = user_id
        self.email = email
        if email:
            super().__init__(f'User not found: {email}')
        else:
            super().__init__(f'User not found: {user_id}')


class EmailAlreadyExistsError(DomainError):
    def __init__(self, email: str) -> None:
        self.email = email
        super().__init__(f'Email already registered: {email}')


class InvalidCredentialsError(DomainError):
    def __init__(self) -> None:
        super().__init__('Invalid email or password')


class GuideNotFoundError(DomainError):
    def __init__(self, guide_id: int) -> None:
        self.guide_id = guide_id
        super().__init__(f'Guide not found: {guide_id}')


class GuideNotVerifiedError(DomainError):
    def __init__(self, guide_id: int) -> None:
        self.guide_id = guide_id
        super().__init__(f'Guide not verified: {guide_id}')


class GuideProfileExistsError(DomainError):
    def __init__(self) -> None:
        super().__init__('Guide verification profile already submitted')


class QuoteNotFoundError(DomainError):
    def __init__(self, quote_id: int) -> None:
        self.quote_id = quote_id
        super().__init__(f'Quote not found: {quote_id}')


class OfferNotFoundError(DomainError):
    def __init__(self, offer_id: int) -> None:
        self.offer_id = offer_id
        super().__init__(f'Offer not found: {offer_id}')


class TripRequestNotFoundError(DomainError):
    def __init__(self, request_id: int) -> None:
        self.request_id = request_id
        super().__init__(f'Trip request not found: {request_id}')


class RouteNotFoundError(DomainError):
    def __init__(self, route_id: int) -> None:
        self.route_id = route_id
        super().__init__(f'Route not found: {route_id}')


class StopNotFoundError(DomainError):
    def __init__(self, stop_id: int, route_id: int | None = None) -> None:
        self.stop_id = stop_id
        self.route_id = route_id
        super().__init__(f'Stop not found: {stop_id}')


class PurchaseNotFoundError(DomainError):
    def __init__(self, purchase_id: int) -> None:
        self.purchase_id = purchase_id
        super().__init__(f'Purchase not found: {purchase_id}')


class PlanNotFoundError(DomainError):
    def __init__(self, plan_id: int) -> None:
        self.plan_id = plan_id
        super().__init__(f'Plan not found: {plan_id}')


class NoteNotFoundError(DomainError):
    def __init__(self, route_id: int, user_id: int) -> None:
        self.route_id = route_id
        self.user_id = user_id
        super().__init__(f'Note not found for route {route_id}')


class ReviewNotFoundError(DomainError):
    def __init__(self, review_id: int) -> None:
        self.review_id = review_id
        super().__init__(f'Review not found: {review_id}')


class ReviewAlreadyExistsError(DomainError):
    def __init__(self, route_id: int, user_id: int) -> None:
        self.route_id = route_id
        self.user_id = user_id
        super().__init__(f'Review already exists for route {route_id}')


class PlaceNotFoundError(DomainError):
    def __init__(self, place_id: int) -> None:
        self.place_id = place_id
        super().__init__(f'Place not found: {place_id}')
