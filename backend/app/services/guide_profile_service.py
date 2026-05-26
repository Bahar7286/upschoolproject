from datetime import datetime, timezone

from app.core.exceptions import GuideNotFoundError, GuideProfileExistsError, GuideNotVerifiedError
from app.models.guide_profile_model import GuideProfile
from app.repositories.guide_profile_repository import GuideProfileRepository
from app.repositories.guide_repository import GuideRepository
from app.repositories.user_repository import UserRepository
from app.schemas.guide_profile_schema import (
    GuideMarketplaceItem,
    GuideMarketplaceListResponse,
    GuideProfileResponse,
    GuideVerificationSubmit,
)


def _split_csv(value: str) -> list[str]:
    if not value:
        return []
    return [p.strip() for p in value.split(',') if p.strip()]


def _join_csv(values: list[str]) -> str:
    return ','.join(dict.fromkeys(v.strip() for v in values if v.strip()))


def _trust_badges(profile: GuideProfile) -> list[str]:
    badges: list[str] = []
    if profile.verification_status == 'verified':
        badges.append('Onaylı kokart')
    if 'tr' in _split_csv(profile.languages):
        badges.append('Türkçe')
    if profile.license_type == 'national':
        badges.append('Ülkesel rehber')
    elif profile.license_type == 'regional':
        badges.append('Bölgesel rehber')
    if profile.university:
        badges.append('Üniversite doğrulandı')
    return badges


class GuideProfileService:
    def __init__(
        self,
        profile_repo: GuideProfileRepository,
        user_repo: UserRepository,
        guide_repo: GuideRepository,
    ) -> None:
        self.profiles = profile_repo
        self.users = user_repo
        self.guides = guide_repo

    async def _get_guide_user(self, guide_id: int):
        user = await self.users.get_by_id(guide_id)
        if not user or user.role != 'guide':
            raise GuideNotFoundError(guide_id)
        return user

    async def submit_verification(
        self, guide_id: int, payload: GuideVerificationSubmit
    ) -> GuideProfileResponse:
        await self._get_guide_user(guide_id)
        existing = await self.profiles.get_by_user_id(guide_id)
        if existing and existing.verification_status in ('under_review', 'verified'):
            raise GuideProfileExistsError()

        profile = existing or GuideProfile(user_id=guide_id)
        profile.license_number = payload.license_number.strip()
        profile.license_type = payload.license_type
        profile.university = payload.university.strip()
        profile.department = payload.department.strip()
        profile.graduation_year = payload.graduation_year
        profile.languages = _join_csv(payload.languages)
        profile.regions = _join_csv(payload.regions)
        profile.document_summary = payload.document_summary.strip()
        profile.bio = payload.bio.strip()
        profile.specialties = _join_csv(payload.specialties)
        profile.min_group_size = payload.min_group_size
        profile.max_group_size = max(payload.max_group_size, payload.min_group_size)
        profile.base_price_per_person = payload.base_price_per_person
        profile.verification_status = 'under_review'
        profile.submitted_at = datetime.now(timezone.utc).replace(tzinfo=None)
        profile.rejection_reason = ''

        if existing:
            saved = await self.profiles.save(profile)
        else:
            saved = await self.profiles.create(profile)
        return await self._to_response(guide_id, saved)

    async def get_my_profile(self, guide_id: int) -> GuideProfileResponse | None:
        await self._get_guide_user(guide_id)
        profile = await self.profiles.get_by_user_id(guide_id)
        if not profile:
            return None
        return await self._to_response(guide_id, profile)

    async def get_public_profile(self, guide_id: int) -> GuideProfileResponse:
        user = await self._get_guide_user(guide_id)
        profile = await self.profiles.get_by_user_id(guide_id)
        if not profile or profile.verification_status != 'verified':
            raise GuideNotVerifiedError(guide_id)
        return await self._to_response(guide_id, profile, user.full_name, user.email)

    async def save_document_path(self, guide_id: int, document_path: str) -> GuideProfileResponse:
        await self._get_guide_user(guide_id)
        profile = await self.profiles.get_by_user_id(guide_id)
        if not profile:
            profile = GuideProfile(user_id=guide_id)
            profile.verification_status = 'pending'
            profile.document_path = document_path
            saved = await self.profiles.create(profile)
        else:
            profile.document_path = document_path
            saved = await self.profiles.save(profile)
        return await self._to_response(guide_id, saved)

    async def list_pending_for_admin(self) -> list[dict]:
        profiles = await self.profiles.list_pending_verification()
        items: list[dict] = []
        for profile in profiles:
            user = await self.users.get_by_id(profile.user_id)
            if not user:
                continue
            items.append(
                {
                    'guide_id': profile.user_id,
                    'full_name': user.full_name,
                    'email': user.email,
                    'verification_status': profile.verification_status,
                    'license_number': profile.license_number,
                    'university': profile.university,
                    'department': profile.department,
                    'document_path': profile.document_path,
                    'document_summary': profile.document_summary,
                    'submitted_at': profile.submitted_at.isoformat() if profile.submitted_at else None,
                }
            )
        return items

    async def moderate_verification(
        self, guide_id: int, *, action: str, rejection_reason: str = ''
    ) -> str:
        await self._get_guide_user(guide_id)
        profile = await self.profiles.get_by_user_id(guide_id)
        if not profile:
            raise GuideNotFoundError(guide_id)
        if action == 'verify':
            profile.verification_status = 'verified'
            profile.verified_at = datetime.now(timezone.utc).replace(tzinfo=None)
            profile.rejection_reason = ''
        else:
            profile.verification_status = 'rejected'
            profile.rejection_reason = rejection_reason or 'Belgeler uygun bulunmadı'
        await self.profiles.save(profile)
        return profile.verification_status

    async def list_marketplace(self, *, offset: int = 0, limit: int = 50) -> GuideMarketplaceListResponse:
        profiles = await self.profiles.list_verified(offset=offset, limit=limit)
        total = await self.profiles.count_verified()
        items: list[GuideMarketplaceItem] = []
        for profile in profiles:
            user = await self.users.get_by_id(profile.user_id)
            if not user:
                continue
            route_count = await self.guides.route_count(profile.user_id)
            items.append(
                GuideMarketplaceItem(
                    guide_id=profile.user_id,
                    full_name=user.full_name,
                    verification_status=profile.verification_status,
                    is_verified=True,
                    languages=_split_csv(profile.languages),
                    regions=_split_csv(profile.regions),
                    specialties=_split_csv(profile.specialties),
                    bio=profile.bio,
                    route_count=route_count,
                    base_price_per_person=profile.base_price_per_person,
                    min_group_size=profile.min_group_size,
                    max_group_size=profile.max_group_size,
                    trust_badges=_trust_badges(profile),
                )
            )
        return GuideMarketplaceListResponse(items=items, total=total)

    async def _to_response(
        self,
        guide_id: int,
        profile: GuideProfile,
        full_name: str | None = None,
        email: str | None = None,
    ) -> GuideProfileResponse:
        user = await self.users.get_by_id(guide_id)
        route_count = await self.guides.route_count(guide_id)
        return GuideProfileResponse(
            guide_id=guide_id,
            full_name=full_name or (user.full_name if user else ''),
            email=email or (user.email if user else ''),
            verification_status=profile.verification_status,
            license_number=profile.license_number,
            license_type=profile.license_type,
            university=profile.university,
            department=profile.department,
            graduation_year=profile.graduation_year,
            languages=_split_csv(profile.languages),
            regions=_split_csv(profile.regions),
            document_summary=profile.document_summary,
            bio=profile.bio,
            specialties=_split_csv(profile.specialties),
            min_group_size=profile.min_group_size,
            max_group_size=profile.max_group_size,
            base_price_per_person=profile.base_price_per_person,
            route_count=route_count,
            is_verified=profile.verification_status == 'verified',
            trust_badges=_trust_badges(profile),
            document_path=profile.document_path,
        )
