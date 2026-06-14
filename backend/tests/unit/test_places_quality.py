from app.schemas.google_schema import GooglePlaceSummary
from app.utils.places_quality import filter_quality_places, is_generic_place


def test_generic_city_name_filtered() -> None:
    city = GooglePlaceSummary(
        place_id='x',
        name='Bursa',
        lat=40.18,
        lng=29.06,
        address='Bursa, Türkiye',
        types=['locality', 'political'],
    )
    assert is_generic_place(city, 'Bursa') is True
    assert filter_quality_places([city], 'Bursa') == []


def test_real_mosque_kept() -> None:
    mosque = GooglePlaceSummary(
        place_id='y',
        name='Ulu Camii',
        lat=40.18,
        lng=29.06,
        address='Osmangazi, Bursa, Türkiye',
        types=['mosque', 'place_of_worship'],
    )
    assert is_generic_place(mosque, 'Bursa') is False
    assert len(filter_quality_places([mosque], 'Bursa')) == 1
