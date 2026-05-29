from app.models.premium_request_model import PremiumRequest
from app.repositories.premium_request_repository import PremiumRequestRepository
from app.repositories.user_repository import UserRepository
from app.schemas.premium_request_schema import (
    PremiumRequestCreate,
    PremiumRequestItem,
    PremiumRequestStatusResponse,
)


class PremiumRequestService:
    def __init__(
        self,
        repo: PremiumRequestRepository,
        user_repo: UserRepository,
    ) -> None:
        self.repo = repo
        self.users = user_repo

    async def status(self, user_id: int) -> PremiumRequestStatusResponse:
        user = await self.users.get_by_id(user_id)
        pending = await self.repo.get_pending_for_user(user_id)
        return PremiumRequestStatusResponse(
            has_pending=pending is not None,
            is_premium=bool(user and user.is_premium),
            last_status=pending.status if pending else None,
        )

    async def submit(self, user_id: int, payload: PremiumRequestCreate) -> None:
        user = await self.users.get_by_id(user_id)
        if not user:
            raise ValueError('Kullanıcı bulunamadı')
        if user.is_premium:
            raise ValueError('Zaten Premium hesabınız var')
        existing = await self.repo.get_pending_for_user(user_id)
        if existing:
            raise ValueError('Bekleyen bir Premium talebiniz zaten var')
        await self.repo.create(
            PremiumRequest(
                user_id=user_id,
                status='pending',
                message=payload.message.strip(),
            )
        )

    async def list_pending_admin(self) -> list[PremiumRequestItem]:
        rows = await self.repo.list_pending()
        items: list[PremiumRequestItem] = []
        for row in rows:
            user = await self.users.get_by_id(row.user_id)
            items.append(
                PremiumRequestItem(
                    request_id=row.request_id,
                    user_id=row.user_id,
                    user_name=user.full_name if user else f'Kullanıcı #{row.user_id}',
                    user_email=user.email if user else '',
                    status=row.status,
                    message=row.message,
                    admin_note=row.admin_note,
                    created_at=row.created_at.isoformat(),
                    reviewed_at=row.reviewed_at.isoformat() if row.reviewed_at else None,
                )
            )
        return items

    async def review(self, request_id: int, *, action: str, admin_note: str = '') -> None:
        row = await self.repo.get_by_id(request_id)
        if not row or row.status != 'pending':
            raise ValueError('Talep bulunamadı veya zaten işlendi')
        user = await self.users.get_by_id(row.user_id)
        if not user:
            raise ValueError('Kullanıcı bulunamadı')
        if action == 'approve':
            user.is_premium = True
            row.status = 'approved'
        else:
            row.status = 'rejected'
        row.admin_note = admin_note.strip()
        await self.repo.save(row)
