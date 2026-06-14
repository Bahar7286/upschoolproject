from app.services.assistant_intent import (
    detect_query_category,
    extract_area_from_text,
    is_accommodation_query,
    is_food_query,
    is_specific_venue_request,
    resolve_intent,
)


def test_food_query_detection() -> None:
    assert is_food_query('yemek mekanı öner')
    assert is_food_query('tam bir lokanta')
    assert not is_food_query('selam')


def test_specific_venue() -> None:
    assert is_specific_venue_request('tam bir mekan öner lokasyon bir lokanta')
    assert is_specific_venue_request('gerçek mekan isim ver')


def test_extract_eminonu() -> None:
    assert extract_area_from_text('istanbul eminönü 1 gün 1000 tl') in ('eminönü', 'eminonu')


def test_resolve_intent_food_after_route() -> None:
    assert resolve_intent('yemek mekanı öner', 'istanbul eminönü 1 gün') == 'food'


def test_category_from_message() -> None:
    assert detect_query_category('yemek mekanı öner', ['history']) == 'restaurant'
    assert detect_query_category('müze öner', ['food']) == 'museum'
    assert detect_query_category('konaklama öner', ['food']) == 'accommodation'
    assert detect_query_category('otel öner Bursa', []) == 'accommodation'


def test_accommodation_not_food() -> None:
    assert is_accommodation_query('Bursa konaklama öner')
    assert not is_food_query('Bursa konaklama öner')
    assert resolve_intent('konaklama öner', '') == 'accommodation'
