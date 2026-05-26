from pydantic import BaseModel, ConfigDict, Field


class GuideVerificationSubmit(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    license_number: str = Field(min_length=4, max_length=64)
    license_type: str = Field(pattern='^(regional|national|professional)$')
    university: str = Field(min_length=2, max_length=180)
    department: str = Field(min_length=2, max_length=180)
    graduation_year: int | None = Field(default=None, ge=1970, le=2035)
    languages: list[str] = Field(min_length=1, max_length=8)
    regions: list[str] = Field(min_length=1, max_length=10)
    document_summary: str = Field(
        min_length=20,
        max_length=2000,
        description='Ruhsatname / çalışma kartı / diploma özeti (platform incelemesi için)',
    )
    bio: str = Field(min_length=20, max_length=1500)
    specialties: list[str] = Field(default_factory=list, max_length=12)
    min_group_size: int = Field(default=1, ge=1, le=50)
    max_group_size: int = Field(default=15, ge=1, le=100)
    base_price_per_person: float = Field(default=0, ge=0)


class GuideProfileResponse(BaseModel):
    guide_id: int
    full_name: str
    email: str
    verification_status: str
    license_number: str
    license_type: str
    university: str
    department: str
    graduation_year: int | None
    languages: list[str]
    regions: list[str]
    document_summary: str
    bio: str
    specialties: list[str]
    min_group_size: int
    max_group_size: int
    base_price_per_person: float
    route_count: int = 0
    is_verified: bool = False
    trust_badges: list[str] = Field(default_factory=list)
    document_path: str = ''


class GuideMarketplaceItem(BaseModel):
    guide_id: int
    full_name: str
    verification_status: str
    is_verified: bool
    languages: list[str]
    regions: list[str]
    specialties: list[str]
    bio: str
    route_count: int
    base_price_per_person: float
    min_group_size: int
    max_group_size: int
    trust_badges: list[str]


class GuideMarketplaceListResponse(BaseModel):
    items: list[GuideMarketplaceItem]
    total: int
