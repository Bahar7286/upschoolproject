import pytest

from app.utils.geolocation import calculate_distance_meters, is_user_near_location

pytestmark = pytest.mark.unit


def test_geo01_same_point_near_zero() -> None:
    dist = calculate_distance_meters(
        user_lat=41.0086,
        user_lng=28.9802,
        target_lat=41.0086,
        target_lng=28.9802,
    )
    assert dist < 1.0


def test_geo02_known_points_reasonable_distance() -> None:
    # Ayasofya ~ Sultanahmet Camii (~300–500 m)
    dist = calculate_distance_meters(
        user_lat=41.0086,
        user_lng=28.9802,
        target_lat=41.0054,
        target_lng=28.9768,
    )
    assert 200 < dist < 800


def test_geo03_is_user_near_location_threshold() -> None:
    assert is_user_near_location(
        user_lat=41.0086,
        user_lng=28.9802,
        target_lat=41.00861,
        target_lng=28.98021,
        threshold_meters=20,
    )
    assert not is_user_near_location(
        user_lat=41.0086,
        user_lng=28.9802,
        target_lat=41.02,
        target_lng=28.99,
        threshold_meters=20,
    )
