from math import asin, cos, radians, sin, sqrt


def calculate_distance_meters(*, user_lat: float, user_lng: float, target_lat: float, target_lng: float) -> float:
    earth_radius_m = 6371000
    delta_lat = radians(target_lat - user_lat)
    delta_lng = radians(target_lng - user_lng)
    user_lat_rad = radians(user_lat)
    target_lat_rad = radians(target_lat)

    haversine = sin(delta_lat / 2) ** 2 + cos(user_lat_rad) * cos(target_lat_rad) * sin(delta_lng / 2) ** 2
    central_angle = 2 * asin(sqrt(haversine))
    return earth_radius_m * central_angle


def is_user_near_location(
    *,
    user_lat: float,
    user_lng: float,
    target_lat: float,
    target_lng: float,
    threshold_meters: float = 20,
) -> bool:
    distance = calculate_distance_meters(
        user_lat=user_lat,
        user_lng=user_lng,
        target_lat=target_lat,
        target_lng=target_lng,
    )
    return distance <= threshold_meters
