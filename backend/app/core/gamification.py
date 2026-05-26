"""Kültür puanı (XP) kuralları ve ödül mağazası."""

from pydantic import BaseModel


class XpRule(BaseModel):
    id: str
    title: str
    description: str
    xp: int


class RewardOffer(BaseModel):
    id: str
    title: str
    description: str
    cost_xp: int
    reward_type: str  # coupon | discount | perk
    value_label: str  # örn. %10, ₺50


XP_RULES: list[XpRule] = [
    XpRule(id='welcome', title='Hoş geldin', description='İlk kayıt bonusu', xp=100),
    XpRule(id='trip_request', title='Gezi talebi', description='Rotalı gezi talebi yayınlama', xp=40),
    XpRule(id='offer_accepted', title='Teklif kabulü', description='Rehber teklifini onaylayıp ödeme tamamlama', xp=60),
    XpRule(id='first_purchase', title='İlk satın alma', description='İlk dijital rota satın alımı', xp=50),
    XpRule(id='route_complete', title='Rotayı bitir', description='Satın alınan rotayı tamamlama', xp=100),
    XpRule(id='review', title='Yorum yaz', description='Tamamlanan rota için yorum', xp=35),
    XpRule(id='daily_streak', title='Günlük seri', description='Her ardışık gün giriş (3/7 gün rozetleri)', xp=15),
    XpRule(id='note_saved', title='Not kaydet', description='Rota notu oluşturma veya güncelleme', xp=20),
]

REWARD_CATALOG: list[RewardOffer] = [
    RewardOffer(
        id='coupon_10',
        title='%10 rota indirimi',
        description='Bir sonraki dijital rota satın alımında geçerli',
        cost_xp=300,
        reward_type='coupon',
        value_label='%10',
    ),
    RewardOffer(
        id='coupon_50try',
        title='₺50 gezi kuponu',
        description='Onaylı rehberli tur ödemesinde (min. ₺400)',
        cost_xp=500,
        reward_type='coupon',
        value_label='₺50',
    ),
    RewardOffer(
        id='discount_group',
        title='Ekstra grup indirimi',
        description='10+ kişilik talepte ek %5 (rehber teklifine eklenir)',
        cost_xp=450,
        reward_type='discount',
        value_label='+5%',
    ),
    RewardOffer(
        id='perk_audio',
        title='Premium ses paketi',
        description='7 gün tüm rotalarda sesli rehber',
        cost_xp=250,
        reward_type='perk',
        value_label='7 gün',
    ),
    RewardOffer(
        id='perk_priority',
        title='Öncelikli talep',
        description='Gezi talebiniz listede 24 saat öne çıkar',
        cost_xp=200,
        reward_type='perk',
        value_label='24s',
    ),
]
