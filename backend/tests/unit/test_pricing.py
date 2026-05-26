import pytest

from app.core.pricing import apply_group_discount, group_discount_rate, platform_fee

pytestmark = pytest.mark.unit


def test_group_discount_rate_tiers() -> None:
    assert group_discount_rate(5) == 0.0
    assert group_discount_rate(10) == 0.10
    assert group_discount_rate(25) == 0.15


def test_apply_group_discount_no_discount() -> None:
    total, rate, label = apply_group_discount(100.0, 4)
    assert total == 100.0
    assert rate == 0.0
    assert 'uygulanmadı' in label


def test_apply_group_discount_10_plus() -> None:
    total, rate, _ = apply_group_discount(200.0, 12)
    assert total == 180.0
    assert rate == 0.10


def test_platform_fee() -> None:
    assert platform_fee(100.0) == 15.0
