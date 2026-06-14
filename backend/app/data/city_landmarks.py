"""İl bazlı bilinen mekanlar — Google sonuç vermediğinde asistan yedek listesi."""

from __future__ import annotations

import unicodedata

from app.schemas.google_schema import GooglePlaceSummary

_LANDMARKS: dict[str, list[dict[str, str | float | None]]] = {
    'Bursa': [
        {'name': 'Ulu Camii', 'address': 'Osmangazi, Bursa', 'category': 'mosque', 'lat': 40.1826, 'lng': 29.0665},
        {'name': 'Yeşil Camii ve Türbe', 'address': 'Yeşil, Osmangazi, Bursa', 'category': 'mosque', 'lat': 40.1817, 'lng': 29.0747},
        {'name': 'Koza Han', 'address': 'Osmangazi, Bursa', 'category': 'bazaar', 'lat': 40.1839, 'lng': 29.0618},
        {'name': 'Cumalıkızık Köyü', 'address': 'Yıldırım, Bursa', 'category': 'historical', 'lat': 40.1736, 'lng': 29.1722},
        {'name': 'Tophane Saat Kulesi', 'address': 'Osmangazi, Bursa', 'category': 'historical', 'lat': 40.1889, 'lng': 29.0578},
        {'name': 'Irgandı Köprüsü', 'address': 'Osmangazi, Bursa', 'category': 'historical', 'lat': 40.1847, 'lng': 29.0603},
    ],
    'İstanbul': [
        {'name': 'Ayasofya', 'address': 'Sultanahmet, Fatih, İstanbul', 'category': 'museum', 'lat': 41.0086, 'lng': 28.9802},
        {'name': 'Topkapı Sarayı', 'address': 'Sultanahmet, Fatih, İstanbul', 'category': 'palace', 'lat': 41.0115, 'lng': 28.9833},
        {'name': 'Sultanahmet Camii', 'address': 'Sultanahmet, Fatih, İstanbul', 'category': 'mosque', 'lat': 41.0054, 'lng': 28.9768},
        {'name': 'Kapalıçarşı', 'address': 'Beyazıt, Fatih, İstanbul', 'category': 'bazaar', 'lat': 41.0107, 'lng': 28.9680},
        {'name': 'Galata Kulesi', 'address': 'Beyoğlu, İstanbul', 'category': 'historical', 'lat': 41.0256, 'lng': 28.9744},
    ],
    'Ankara': [
        {'name': 'Anıtkabir', 'address': 'Çankaya, Ankara', 'category': 'historical', 'lat': 39.9251, 'lng': 32.8369},
        {'name': 'Anadolu Medeniyetleri Müzesi', 'address': 'Ulus, Altındağ, Ankara', 'category': 'museum', 'lat': 39.9389, 'lng': 32.8619},
        {'name': 'Kocatepe Camii', 'address': 'Kızılay, Çankaya, Ankara', 'category': 'mosque', 'lat': 39.9167, 'lng': 32.8597},
    ],
    'İzmir': [
        {'name': 'Saat Kulesi', 'address': 'Konak, İzmir', 'category': 'historical', 'lat': 38.4192, 'lng': 27.1287},
        {'name': 'Kemeraltı Çarşısı', 'address': 'Konak, İzmir', 'category': 'bazaar', 'lat': 38.4189, 'lng': 27.1294},
        {'name': 'Efes Antik Kenti', 'address': 'Selçuk, İzmir', 'category': 'historical', 'lat': 37.9390, 'lng': 27.3410},
    ],
    'Antalya': [
        {'name': 'Kaleiçi', 'address': 'Muratpaşa, Antalya', 'category': 'historical', 'lat': 36.8841, 'lng': 30.7056},
        {'name': 'Antalya Müzesi', 'address': 'Konyaaltı, Antalya', 'category': 'museum', 'lat': 36.8857, 'lng': 30.6766},
        {'name': 'Düden Şelalesi', 'address': 'Kepez, Antalya', 'category': 'street', 'lat': 36.8572, 'lng': 30.7833},
    ],
    'Gaziantep': [
        {'name': 'Zeugma Mozaik Müzesi', 'address': 'Şehitkamil, Gaziantep', 'category': 'museum', 'lat': 37.0662, 'lng': 37.3833},
        {'name': 'Gaziantep Kalesi', 'address': 'Şahinbey, Gaziantep', 'category': 'historical', 'lat': 37.0660, 'lng': 37.3780},
    ],
    'Trabzon': [
        {'name': 'Sümela Manastırı', 'address': 'Maçka, Trabzon', 'category': 'historical', 'lat': 40.6890, 'lng': 39.6580},
        {'name': 'Uzungöl', 'address': 'Çaykara, Trabzon', 'category': 'street', 'lat': 40.6190, 'lng': 40.2880},
    ],
    'Nevşehir': [
        {'name': 'Göreme Açık Hava Müzesi', 'address': 'Göreme, Nevşehir', 'category': 'museum', 'lat': 38.6431, 'lng': 34.8289},
        {'name': 'Uçhisar Kalesi', 'address': 'Uçhisar, Nevşehir', 'category': 'historical', 'lat': 38.6310, 'lng': 34.8050},
    ],
    'Kapadokya': [
        {'name': 'Göreme Açık Hava Müzesi', 'address': 'Göreme, Nevşehir', 'category': 'museum', 'lat': 38.6431, 'lng': 34.8289},
        {'name': 'Uçhisar Kalesi', 'address': 'Uçhisar, Nevşehir', 'category': 'historical', 'lat': 38.6310, 'lng': 34.8050},
    ],
}


def _norm_key(name: str) -> str:
    t = unicodedata.normalize('NFKD', name.strip().lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return t.replace('ı', 'i').replace(' ', '')


_ALIASES = {
    'kapadokya': 'Nevşehir',
    'istanbul': 'İstanbul',
    'izmir': 'İzmir',
    'ankara': 'Ankara',
}


def resolve_landmark_city(city: str) -> str:
    key = _norm_key(city)
    if key in _ALIASES:
        return _ALIASES[key]
    for name in _LANDMARKS:
        if _norm_key(name) == key:
            return name
    return city.strip()


def city_landmark_places(city: str) -> list[GooglePlaceSummary]:
    resolved = resolve_landmark_city(city)
    rows = _LANDMARKS.get(resolved) or _LANDMARKS.get(city.strip()) or []
    out: list[GooglePlaceSummary] = []
    for i, row in enumerate(rows):
        name = str(row['name'])
        out.append(
            GooglePlaceSummary(
                place_id=f'landmark-{resolved.lower()}-{i}',
                name=name,
                lat=float(row.get('lat') or 0),
                lng=float(row.get('lng') or 0),
                address=str(row.get('address') or resolved),
                category=str(row.get('category') or 'historical'),
                types=['tourist_attraction'],
            )
        )
    return out
