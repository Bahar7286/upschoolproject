"""Grup indirimi ve platform komisyonu."""

PLATFORM_FEE_RATE = 0.15

# (minimum grup boyutu, indirim oranı)
GROUP_DISCOUNT_TIERS: list[tuple[int, float]] = [
    (10, 0.10),
    (20, 0.15),
]


def group_discount_rate(group_size: int) -> float:
    rate = 0.0
    for min_size, discount in GROUP_DISCOUNT_TIERS:
        if group_size >= min_size:
            rate = discount
    return rate


def apply_group_discount(base_total: float, group_size: int) -> tuple[float, float, str]:
    """(indirimli_toplam, indirim_orani, aciklama)"""
    rate = group_discount_rate(group_size)
    if rate <= 0:
        return base_total, 0.0, 'Grup indirimi uygulanmadı'
    discounted = round(base_total * (1 - rate), 2)
    pct = int(rate * 100)
    return discounted, rate, f'{group_size}+ kişi için %{pct} grup indirimi uygulandı'


def platform_fee(amount: float) -> float:
    return round(amount * PLATFORM_FEE_RATE, 2)
