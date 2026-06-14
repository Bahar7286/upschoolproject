"""City coordinate and filter tests."""

from app.utils.city_coords import haversine_km, resolve_city_coords
from app.utils.district_filter import address_matches_city, filter_by_city


class _Place:
    def __init__(self, name: str, address: str, lat: float, lng: float) -> None:
        self.name = name
        self.address = address
        self.lat = lat
        self.lng = lng


def test_resolve_adiyaman_coords() -> None:
    coords = resolve_city_coords('Adıyaman')
    assert coords is not None
    lat, lng = coords
    assert 37.5 < lat < 38.0
    assert 38.0 < lng < 38.5
    dist_istanbul = haversine_km(lat, lng, 41.0082, 28.9784)
    assert dist_istanbul > 700


def test_filter_by_city_excludes_istanbul() -> None:
    places = [
        _Place('Galata Kulesi', 'Beyoğlu, İstanbul', 41.0256, 28.9744),
        _Place('Nemrut Dağı', 'Adıyaman', 37.9810, 38.7410),
    ]
    filtered = filter_by_city(places, 'Adıyaman')
    names = [p.name for p in filtered]
    assert 'Nemrut Dağı' in names
    assert 'Galata Kulesi' not in names


def test_address_matches_city() -> None:
    assert address_matches_city('Kahta, Adıyaman', 'Adıyaman') is True
    assert address_matches_city('Fatih, İstanbul', 'Adıyaman') is False
