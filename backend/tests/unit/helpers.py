"""Unit test payload helpers."""

from app.core.security import hash_password
from app.models.user_model import User
from app.schemas.guide_profile_schema import GuideVerificationSubmit


def verification_payload(**overrides) -> GuideVerificationSubmit:
    data = {
        'license_number': 'IST-UNIT-99999',
        'license_type': 'regional',
        'university': 'Test Üniversitesi',
        'department': 'Turist Rehberliği',
        'graduation_year': 2020,
        'languages': ['tr', 'en'],
        'regions': ['Istanbul'],
        'document_summary': 'Unit test belge özeti en az yirmi karakter uzunluğunda yazılmıştır.',
        'bio': 'Unit test rehber biyografisi en az yirmi karakter uzunluğunda yazılmıştır.',
        'specialties': ['history'],
        'min_group_size': 2,
        'max_group_size': 12,
        'base_price_per_person': 99.0,
    }
    data.update(overrides)
    return GuideVerificationSubmit(**data)


async def create_guide_user(session, *, email: str, full_name: str = 'Unit Guide') -> User:
    user = User(
        full_name=full_name,
        email=email.lower(),
        role='guide',
        password_hash=hash_password('guidepass99'),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
