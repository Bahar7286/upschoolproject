from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(default='tourist', pattern='^(tourist|guide|admin)$')
    password: str | None = Field(default=None, min_length=6, max_length=128)


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    role: str | None = Field(default=None, pattern='^(tourist|guide|admin)$')
    password: str | None = Field(default=None, min_length=6, max_length=128)


class UserListResponse(BaseModel):
    items: list['UserResponse']
    total: int
    offset: int
    limit: int


class UserPreferencesUpdate(BaseModel):
    interests: list[str] = Field(default_factory=list, max_length=12)
    duration_minutes: int = Field(default=120, ge=30, le=720)
    budget: float = Field(default=150.0, ge=0)
    theme_preference: str = Field(
        default='system',
        pattern='^(system|light|dark|heritage|ocean|sunset|forest|classic)$',
    )
    preferred_language: str = Field(default='tr', pattern='^(tr|en|de)$')
    onboarding_completed: bool = False


class XpRuleItem(BaseModel):
    id: str
    title: str
    description: str
    xp: int


class RewardItem(BaseModel):
    id: str
    title: str
    description: str
    cost_xp: int
    reward_type: str
    value_label: str
    owned: bool = False


class GamificationResponse(BaseModel):
    xp: int
    streak_days: int
    level: int
    level_name: str
    next_level_xp: int
    badges: list[str]
    weekly_rank: int
    xp_rules: list[XpRuleItem] = Field(default_factory=list)
    rewards: list[RewardItem] = Field(default_factory=list)
    redeemed_rewards: list[str] = Field(default_factory=list)


class RedeemRewardRequest(BaseModel):
    reward_id: str = Field(min_length=3, max_length=40)


class RedeemRewardResponse(BaseModel):
    reward_id: str
    title: str
    code: str
    remaining_xp: int
    message: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    full_name: str
    xp: int
    streak_days: int
    badge_count: int


class LeaderboardResponse(BaseModel):
    period: str = 'weekly'
    entries: list[LeaderboardEntry] = Field(default_factory=list)
    your_rank: int | None = None


class CompleteRouteResponse(BaseModel):
    xp_gained: int
    total_xp: int
    streak_days: int
    new_badges: list[str]
    level_name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: EmailStr
    role: str
    interests: list[str] = Field(default_factory=list)
    duration_minutes: int = 120
    budget: float = 150.0
    theme_preference: str = 'system'
    preferred_language: str = 'tr'
    onboarding_completed: bool = False
    xp: int = 0
    streak_days: int = 0
    badges: list[str] = Field(default_factory=list)
