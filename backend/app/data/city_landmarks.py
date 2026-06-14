"""İl bazlı bilinen mekanlar — Google sonuç vermediğinde asistan yedek listesi."""

from __future__ import annotations

import unicodedata

from app.schemas.google_schema import GooglePlaceSummary

_LANDMARKS: dict[str, list[dict[str, str | float | None]]] = {
    'Bursa': [
        {
            'name': 'Ulu Camii',
            'address': 'Osmangazi, Bursa',
            'category': 'mosque',
            'lat': 40.1826,
            'lng': 29.0665,
            'description': (
                '1399’da Yıldırım Bayezid döneminde tamamlanan Ulu Camii, yirmi kubbeli devasa harimi ve '
                'duvarlarındaki hat levhalarıyla erken Osmanlı mimarisinin en görkemli örneklerindendir. '
                'Osmangazi ilçesinin kalbinde yer alır; çevresindeki çarşılar ve koza hanlarıyla birlikte gezilir.'
            ),
        },
        {
            'name': 'Yeşil Camii ve Türbe',
            'address': 'Yeşil, Osmangazi, Bursa',
            'category': 'mosque',
            'lat': 40.1817,
            'lng': 29.0747,
            'description': (
                'Çini kaplamalarıyla ünlü Yeşil Camii, 1421’de I. Mehmed (Çelebi) için inşa edilmiştir. '
                'Yeşil Türbe aynı külliyede yer alır; Bursa’nın “Yeşil Bursa” lakabını anlatan en ikonik duraktır.'
            ),
        },
        {
            'name': 'Koza Han',
            'address': 'Osmangazi, Bursa',
            'category': 'bazaar',
            'lat': 40.1839,
            'lng': 29.0618,
            'description': (
                '1491’de II. Bayezid tarafından yaptırılan Koza Han, ipek koza ticaretinin merkeziydi. '
                'Avlulu Osmanlı han mimarisinin güzel bir örneği olan yapı, günümüzde çay bahçeleri ve '
                'el sanatları dükkânlarıyla ziyaretçilerini ağırlar.'
            ),
        },
        {
            'name': 'Cumalıkızık Köyü',
            'address': 'Yıldırım, Bursa',
            'category': 'historical',
            'lat': 40.1736,
            'lng': 29.1722,
            'description': (
                'UNESCO Dünya Mirası Listesi’nde yer alan Cumalıkızık, Osmanlı kırsal mimarisinin '
                'korunduğu taş evler, dar sokaklar ve geleneksel yaşam kültürüyle ünlüdür. '
                'Yürüyüş ve fotoğraf için ideal bir açık hava müzesidir.'
            ),
        },
        {
            'name': 'Tophane Saat Kulesi',
            'address': 'Osmangazi, Bursa',
            'category': 'historical',
            'lat': 40.1889,
            'lng': 29.0578,
            'description': (
                '1906’da Sultan II. Abdülhamid’in tahta çıkışını anmak için inşa edilen saat kulesi, '
                'Tophane Parkı’nda Bursa manzarasına hakim bir noktada durur. '
                'Osmanlı dönemi saat kuleleri geleneğinin Anadolu’daki seçkin örneklerindendir.'
            ),
        },
        {
            'name': 'Irgandı Köprüsü',
            'address': 'Osmangazi, Bursa',
            'category': 'historical',
            'lat': 40.1847,
            'lng': 29.0603,
            'description': (
                '1442’de yapılan Irgandı Köprüsü, dünyada üzerinde dükkan bulunan ender köprülerden biridir. '
                'Gökdere üzerindeki bu çok katlı köprü, Bursa’nın tarihî ticaret dokusunu yansıtır.'
            ),
        },
    ],
    'İstanbul': [
        {
            'name': 'Ayasofya',
            'address': 'Sultanahmet, Fatih, İstanbul',
            'category': 'museum',
            'lat': 41.0086,
            'lng': 28.9802,
            'description': '532’de inşa edilen Ayasofya, Bizans ve Osmanlı dönemlerinin izlerini taşıyan dünya mirası bir yapıdır.',
        },
        {
            'name': 'Topkapı Sarayı',
            'address': 'Sultanahmet, Fatih, İstanbul',
            'category': 'palace',
            'lat': 41.0115,
            'lng': 28.9833,
            'description': 'Osmanlı padişahlarının dört yüzyıl boyunca yaşadığı Topkapı Sarayı, hazine ve kutsal emanetlerle doludur.',
        },
        {
            'name': 'Sultanahmet Camii',
            'address': 'Sultanahmet, Fatih, İstanbul',
            'category': 'mosque',
            'lat': 41.0054,
            'lng': 28.9768,
            'description': '1609–1617 arasında inşa edilen Sultanahmet Camii, altı minaresi ve İznik çinileriyle İstanbul siluetinin simgesidir.',
        },
        {
            'name': 'Kapalıçarşı',
            'address': 'Beyazıt, Fatih, İstanbul',
            'category': 'bazaar',
            'lat': 41.0107,
            'lng': 28.9680,
            'description': '1461’den beri ticaretin kalbi olan Kapalıçarşı, altın, halı ve baharat dükkânlarıyla dünyanın en eski çarşılarındandır.',
        },
        {
            'name': 'Galata Kulesi',
            'address': 'Beyoğlu, İstanbul',
            'category': 'historical',
            'lat': 41.0256,
            'lng': 28.9744,
            'description': 'Genoese döneminden kalma Galata Kulesi, Haliç ve Boğaz manzarası sunan 67 metrelik tarihî gözetleme kulesidir.',
        },
    ],
    'Ankara': [
        {
            'name': 'Anıtkabir',
            'address': 'Çankaya, Ankara',
            'category': 'historical',
            'lat': 39.9251,
            'lng': 32.8369,
            'description': (
                'Türkiye Cumhuriyeti’nin kurucusu Mustafa Kemal Atatürk’ün ebedî istirahatgâhı Anıtkabir, '
                'Ankara’nın en anlamlı anıtsal yapısıdır. Mozole, müze ve tören meydanıyla ziyaretçilerini ağırlar.'
            ),
        },
        {
            'name': 'Anadolu Medeniyetleri Müzesi',
            'address': 'Ulus, Altındağ, Ankara',
            'category': 'museum',
            'lat': 39.9389,
            'lng': 32.8619,
            'description': (
                'Hitit, Frig, Urartu ve Roma dönemlerine ait eserlerin sergilendiği müze, '
                'Anadolu’nun binlerce yıllık medeniyet tarihini tek çatı altında anlatır.'
            ),
        },
        {
            'name': 'Kocatepe Camii',
            'address': 'Kızılay, Çankaya, Ankara',
            'category': 'mosque',
            'lat': 39.9167,
            'lng': 32.8597,
            'description': (
                '1978’de tamamlanan Kocatepe Camii, neo-klasik Osmanlı üslubunda inşa edilmiş devasa bir ibadethanedir. '
                'Ankara siluetinin en tanınır yapılarından biridir.'
            ),
        },
    ],
    'İzmir': [
        {
            'name': 'Saat Kulesi',
            'address': 'Konak, İzmir',
            'category': 'historical',
            'lat': 38.4192,
            'lng': 27.1287,
            'description': '1901’de II. Abdülhamid’in tahta çıkışını kutlamak için yapılan Konak Saat Kulesi, İzmir’in simgesidir.',
        },
        {
            'name': 'Kemeraltı Çarşısı',
            'address': 'Konak, İzmir',
            'category': 'bazaar',
            'lat': 38.4189,
            'lng': 27.1294,
            'description': (
                'Osmanlı döneminden günümüze uzanan Kemeraltı, baharat, gümüş ve sokak lezzetleriyle '
                'İzmir’in en canlı tarihî ticaret merkezidir.'
            ),
        },
        {
            'name': 'Efes Antik Kenti',
            'address': 'Selçuk, İzmir',
            'category': 'historical',
            'lat': 37.9390,
            'lng': 27.3410,
            'description': (
                'Antik dünyanın en büyük liman kentlerinden Efes, Celsus Kütüphanesi ve Büyük Tiyatro’suyla '
                'UNESCO listesindeki en etkileyici arkeolojik alanlardan biridir.'
            ),
        },
    ],
    'Antalya': [
        {
            'name': 'Kaleiçi',
            'address': 'Muratpaşa, Antalya',
            'category': 'historical',
            'lat': 36.8841,
            'lng': 30.7056,
            'description': (
                'Antalya’nın tarihî çekirdeği Kaleiçi, Roma-Osmanlı sokakları, Hadrian Kapısı ve '
                'marina manzarasıyla Akdeniz’in en çekici mahallelerindendir.'
            ),
        },
        {
            'name': 'Antalya Müzesi',
            'address': 'Konyaaltı, Antalya',
            'category': 'museum',
            'lat': 36.8857,
            'lng': 30.6766,
            'description': (
                'Perge, Side ve Patara kazılarından gelen heykelleri barındıran Antalya Müzesi, '
                'Akdeniz bölgesi arkeolojisinin en zengin koleksiyonlarından birine sahiptir.'
            ),
        },
        {
            'name': 'Düden Şelalesi',
            'address': 'Kepez, Antalya',
            'category': 'street',
            'lat': 36.8572,
            'lng': 30.7833,
            'description': (
                'Düden Çayı’nın denize döküldüğü etkileyici şelale, Antalya’nın doğa ve fotoğraf rotalarının '
                'vazgeçilmez duraklarındandır.'
            ),
        },
    ],
    'Gaziantep': [
        {
            'name': 'Zeugma Mozaik Müzesi',
            'address': 'Şehitkamil, Gaziantep',
            'category': 'museum',
            'lat': 37.0662,
            'lng': 37.3833,
            'description': (
                'Zeugma antik kentinden çıkarılan “Çingene Kızı” mozaiği de dahil dünyaca ünlü eserlerin '
                'sergilendiği müze, Gaziantep’in kültür turizmi vitrinidir.'
            ),
        },
        {
            'name': 'Gaziantep Kalesi',
            'address': 'Şahinbey, Gaziantep',
            'category': 'historical',
            'lat': 37.0660,
            'lng': 37.3780,
            'description': (
                'Roma dönemine uzanan temelleriyle bilinen Gaziantep Kalesi, şehir merkezinde '
                'panoramik manzara ve arkeolojik sergiler sunar.'
            ),
        },
    ],
    'Trabzon': [
        {
            'name': 'Sümela Manastırı',
            'address': 'Maçka, Trabzon',
            'category': 'historical',
            'lat': 40.6890,
            'lng': 39.6580,
            'description': (
                'Karadere vadisinin sarp kayalıklarına oyulmuş Sümela Manastırı, Bizans döneminden kalma '
                'freskleri ve mistik atmosferiyle Karadeniz’in en etkileyici yapılarındandır.'
            ),
        },
        {
            'name': 'Uzungöl',
            'address': 'Çaykara, Trabzon',
            'category': 'street',
            'lat': 40.6190,
            'lng': 40.2880,
            'description': (
                'Yüksek yaylalarda göl manzarası, ahşap evler ve doğa yürüyüşleri sunan Uzungöl, '
                'Trabzon’un en popüler doğa duraklarındandır.'
            ),
        },
    ],
    'Nevşehir': [
        {
            'name': 'Göreme Açık Hava Müzesi',
            'address': 'Göreme, Nevşehir',
            'category': 'museum',
            'lat': 38.6431,
            'lng': 34.8289,
            'description': (
                'Kapadokya’nın kayalara oyulmuş kilise ve manastırları, freskleriyle UNESCO Dünya Mirası '
                'alanı Göreme Açık Hava Müzesi’nde sergilenir.'
            ),
        },
        {
            'name': 'Uçhisar Kalesi',
            'address': 'Uçhisar, Nevşehir',
            'category': 'historical',
            'lat': 38.6310,
            'lng': 34.8050,
            'description': (
                'Bölgenin en yüksek noktasındaki Uçhisar Kalesi, tüf kayalıklarına oyulmuş odaları ve '
                '360 derece Kapadokya manzarasıyla ünlüdür.'
            ),
        },
    ],
    'Kapadokya': [
        {
            'name': 'Göreme Açık Hava Müzesi',
            'address': 'Göreme, Nevşehir',
            'category': 'museum',
            'lat': 38.6431,
            'lng': 34.8289,
            'description': 'Kapadokya’nın kayalık kilise kompleksi; freskler ve peri bacalarıyla dünya mirası alan.',
        },
        {
            'name': 'Uçhisar Kalesi',
            'address': 'Uçhisar, Nevşehir',
            'category': 'historical',
            'lat': 38.6310,
            'lng': 34.8050,
            'description': 'Kapadokya vadilerine hakim kayalık kale; gün batımı manzarası için ideal nokta.',
        },
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
