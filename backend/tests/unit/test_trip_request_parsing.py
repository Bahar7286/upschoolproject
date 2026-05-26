import pytest

from app.services.trip_request_service import _parse_stops, _serialize_stops
from app.schemas.trip_request_schema import PlannedStop

pytestmark = pytest.mark.unit


def test_parse_stops_empty() -> None:
    assert _parse_stops('') == []
    assert _parse_stops('[]') == []


def test_parse_stops_invalid_json_returns_empty() -> None:
    assert _parse_stops('{broken') == []


def test_serialize_stops_orders_by_order_field() -> None:
    raw = _serialize_stops(
        [
            PlannedStop(place_id=2, name='B', order=2),
            PlannedStop(place_id=1, name='A', order=1),
        ]
    )
    parsed = _parse_stops(raw)
    assert [s.name for s in parsed] == ['A', 'B']
