"""Assistant district strict filtering tests."""

from app.utils.district_filter import filter_by_district


class _Place:
    def __init__(self, name: str, address: str) -> None:
        self.name = name
        self.address = address


def test_eminonu_food_excludes_beyoglu() -> None:
    places = [
        _Place('Hamdi Restaurant', 'Eminönü, Fatih'),
        _Place('Nevizade', 'Beyoğlu, İstanbul'),
    ]
    filtered = filter_by_district(places, 'Eminönü')
    names = [p.name for p in filtered]
    assert 'Hamdi Restaurant' in names
    assert 'Nevizade' not in names
