/** Yer adına göre zengin anlatım — API kısa açıklamayı tamamlar. */
const RICH_BY_NAME: Record<string, { story: string; tips: string[]; hours?: string }> = {
  'Ayasofya-i Kebir Camii': {
    story:
      '532 yılında Bizans İmparatoru I. Justinianus tarafından “Kutsal Bilgelik” anlamına gelen Hagia Sophia adıyla inşa edildi. 1453’te İstanbul’un fethinden sonra camiye dönüştürüldü; 1935–2020 arası müze, günümüzde yeniden ibadethane statüsünde. Kubbesi ve mozaikleri dünya mimarlık tarihinin dönüm noktalarındandır.',
    tips: ['Cuma namazı saatlerinde yoğunluk artar.', 'Üst galeri için ayrı bilet gerekebilir.', 'Rahat ayakkabı ve su şişesi önerilir.'],
    hours: 'Ziyaret saatleri mevsime göre değişir; resmi siteyi kontrol edin.',
  },
  'Topkapı Sarayı': {
    story:
      'Osmanlı padişahlarının yaklaşık 400 yıl boyunca idare merkezi. Harem, hazine ve kutsal emanetler bölümleri ayrı deneyim sunar. Boğaz manzaralı teraslar fotoğraf için idealdir.',
    tips: ['Harem için ek bilet alın.', 'Sabah erken saatler daha sakin.', 'Audio guide uygulamasını indirin.'],
    hours: 'Salı günleri kapalı olabilir.',
  },
  'Kapalıçarşı': {
    story:
      '1461’den beri ticaretin kalbi; 61 sokak ve binlerce dükkan. Altın, halı, deri ve baharat dükkânları turistlerin klasik rotasıdır. Pazarlık kültürünün merkezidir.',
    tips: ['Nakit ve kart karşılaştırması yapın.', 'Sabit fiyatlı vitrinleri not edin.', 'Öğle saatlerinde kalabalık artar.'],
  },
};

const CATEGORY_STORY: Record<string, string> = {
  museum: 'Bu müze, şehrin katmanlı tarihini tek çatı altında anlatır. Koleksiyonlar Bizans, Osmanlı ve Cumhuriyet dönemlerine uzanır.',
  palace: 'Saray yapıları, imparatorluk protokolünü ve günlük saray yaşamını gözler önüne serer.',
  mosque: 'Mimari detaylar, hat sanatı ve avlu düzeni İslam estetiğinin önemli örnekleridir.',
  restaurant: 'Yerel mutfak, sokak lezzetleri ve geleneksel tatlar bu bölgenin kültürel kimliğinin parçasıdır.',
};

export function getRichPlaceContent(name: string, category: string, baseDescription: string) {
  const rich = RICH_BY_NAME[name];
  const story = rich?.story ?? `${baseDescription}\n\n${CATEGORY_STORY[category] ?? 'Bu nokta İstanbul rotanızda keşfedilmeye değer bir duraktır.'}`;
  const tips = rich?.tips ?? ['Haritada konumu işaretleyin.', 'Yakındaki rotalarla birleştirerek zaman kazanın.'];
  return { story, tips, hours: rich?.hours };
}

export function googleMapsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
}
