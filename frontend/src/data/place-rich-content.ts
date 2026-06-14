/** Yer adına göre zengin anlatım — API kısa açıklamayı tamamlar. */

export type RichPlaceContent = {
  story: string;
  tips: string[];
  hours?: string;
};

const DEFAULT_TIPS = [
  'Haritada konumu işaretleyip aktif rotanıza ekleyin.',
  'Yoğun saatlerde erken ziyaret veya akşamüstü daha sakin deneyim sunar.',
  'Sesli anlatım panelinden Türkçe veya İngilizce dinleyebilirsiniz.',
];

const RICH_BY_NAME: Record<string, RichPlaceContent> = {
  'Ayasofya-i Kebir Camii': {
    story:
      '532 yılında Bizans İmparatoru I. Justinianus tarafından inşa edildi. 1453’te İstanbul’un fethinden sonra camiye dönüştürüldü. Kubbesi ve mozaikleri dünya mimarlık tarihinin dönüm noktalarındandır.',
    tips: ['Cuma namazı saatlerinde yoğunluk artar.', 'Rahat ayakkabı ve su şişesi önerilir.'],
    hours: 'Ziyaret saatleri mevsime göre değişir.',
  },
  Ayasofya: {
    story: 'İstanbul’un fethinden önce ve sonra farklı inançlara ev sahipliği yapan dünya mirası yapı.',
    tips: DEFAULT_TIPS,
  },
  'Topkapı Sarayı': {
    story: 'Osmanlı padişahlarının yaklaşık 400 yıl boyunca idare merkezi. Harem, hazine ve kutsal emanetler bölümleri ayrı deneyim sunar.',
    tips: ['Harem için ek bilet alın.', 'Sabah erken saatler daha sakin.'],
    hours: 'Salı günleri kapalı olabilir.',
  },
  'Kapalıçarşı': {
    story: '1461’den beri ticaretin kalbi; altın, halı, deri ve baharat dükkânları turistlerin klasik rotasıdır.',
    tips: ['Nakit ve kart karşılaştırması yapın.', 'Öğle saatlerinde kalabalık artar.'],
  },
  'Koza Han': {
    story: '1491’de II. Bayezid tarafından yaptırılan Koza Han, ipek koza ticaretinin kalbi olmuş avlulu han mimarisinin güzel bir örneğidir.',
    tips: ['Avludaki çay bahçesinde mola verin.', 'Ulu Camii yürüme mesafesindedir.'],
  },
  'Ulu Camii': {
    story: '1399’da tamamlanan Ulu Camii, yirmi kubbeli harimi ve hat levhalarıyla erken Osmanlı mimarisinin şaheseridir.',
    tips: ['Namaz vakitlerinde ziyaret kısıtlı olabilir.', 'Sessiz ve saygılı ziyaret önemlidir.'],
  },
  Anıtkabir: {
    story:
      'Anıtkabir, Türkiye Cumhuriyeti’nin kurucusu Mustafa Kemal Atatürk’ün anıt mezarıdır. ' +
      '1944–1953 yılları arasında inşa edilen kompleks; Aslanlı Yol, tören meydanı, mozole ve ' +
      'Anıtkabir Atatürk ve Kurtuluş Savaşı Müzesi’nden oluşur. Mozolede Atatürk’ün naşı bulunur; ' +
      'müze bölümünde Cumhuriyet’in kuruluş süreci, savaş dönemi ve Atatürk’ün kişisel eşyaları sergilenir. ' +
      'Ankara’nın Çankaya ilçesindeki Anıttepe’de, şehre hakim bir tepe üzerinde yer alır.',
    tips: [
      'Aslanlı Yol yürüyüşünü kaçırmayın; tören meydanında durup mozoleyi izleyin.',
      'Müze bölümü için en az bir saat ayırın.',
      'Resmî tören günlerinde yoğunluk artabilir; sabah erken saatler daha sakindir.',
    ],
    hours: 'Her gün ziyarete açıktır; müze saatleri mevsime göre değişebilir.',
  },
  'Efes Antik Kenti': {
    story: 'Celsus Kütüphanesi ve Büyük Tiyatro’suyla UNESCO listesindeki en etkileyici arkeolojik alanlardan biri.',
    tips: ['En az 2–3 saat planlayın.', 'Güneş kremi ve şapka şart.'],
  },
  'Göreme Açık Hava Müzesi': {
    story: 'Kapadokya’nın kayalara oyulmuş kilise ve manastırları, freskleriyle UNESCO Dünya Mirası alanı.',
    tips: ['Sabah erken saatler daha serin.', 'Rahat ayakkabı gerekli.'],
  },
};

const CATEGORY_STORY: Record<string, string> = {
  museum: 'Bu müze, bölgenin katmanlı tarihini tek çatı altında anlatır. Arkeolojik buluntular, etnografik eserler ve dönem sanatı bir arada sergilenir.',
  palace: 'Saray yapıları, imparatorluk protokolünü, günlük yaşamı ve hazine koleksiyonlarını gözler önüne serer.',
  mosque: 'Cami mimarisi, hat sanatı ve avlu düzeni İslam estetiğinin önemli örneklerini sunar. Sessizlik ve uygun kıyafet önemlidir.',
  historical: 'Tarihî yapı, bulunduğu şehrin kimliğini şekillendiren olaylara tanıklık etmiştir.',
  bazaar: 'Geleneksel çarşı ve han kültürü, yerel ticaretin ve el sanatlarının merkezidir.',
  restaurant: 'Yerel mutfak ve sokak lezzetleri bölgenin kültürel kimliğinin parçasıdır.',
  accommodation: 'Konaklama bölgesi, gezi rotanızın merkezine yakın konum avantajı sunabilir.',
  street: 'Sokak veya doğal durak; yürüyüş, manzara ve fotoğraf için ideal bir ara noktadır.',
};

export function getRichPlaceContent(
  name: string,
  category: string,
  baseDescription: string,
  city?: string,
  district?: string,
): RichPlaceContent {
  const rich = RICH_BY_NAME[name];
  if (rich) return rich;

  const location = [district, city].filter(Boolean).join(', ') || 'Türkiye';
  const catStory = CATEGORY_STORY[category] ?? CATEGORY_STORY.historical;
  const trimmed = baseDescription?.trim() ?? '';

  if (trimmed.length >= 120) {
    return { story: `${name}, ${location} — ${trimmed}\n\n${catStory}`, tips: DEFAULT_TIPS };
  }

  return {
    story: `${name}, ${location} bölgesinde yer alan önemli bir duraktır. ${trimmed ? `${trimmed} ` : ''}${catStory}`,
    tips: DEFAULT_TIPS,
  };
}

export function buildNarrationContext(params: {
  name: string;
  category?: string;
  city?: string;
  district?: string;
  description?: string;
  story?: string;
}): string {
  const parts = [
    params.name,
    [params.district, params.city].filter(Boolean).join(', '),
    params.category ? `Kategori: ${params.category}` : '',
    params.story?.trim(),
    params.description?.trim(),
  ].filter(Boolean);
  return parts.join('\n\n');
}

export const CITY_INTRO: Record<string, string> = {
  İstanbul: 'İstanbul, iki kıtayı birleştiren Bizans ve Osmanlı mirasını taşıyan dünya metropolüdür.',
  Bursa: 'Bursa, Osmanlı’nın ilk başkenti; ipek ticareti, yeşil camileri ve Cumalıkızık ile zengin bir kültür rotası sunar.',
  Ankara: 'Ankara, Cumhuriyet’in başkenti; Anıtkabir ve Anadolu Medeniyetleri Müzesi ile tarih ve çağdaş yaşamı bir arada sunar.',
  İzmir: 'İzmir, Ege’nin incisi; antik Efes, Kemeraltı ve kordon boyu ile canlı bir kültür merkezidir.',
  Antalya: 'Antalya, Kaleiçi, antik kentler ve doğal güzellikleriyle dört mevsim turizm sunar.',
  Nevşehir: 'Nevşehir ve Kapadokya; peri bacaları, yeraltı şehirleri ve kaya kiliseleriyle benzersiz bir bölgedir.',
  Gaziantep: 'Gaziantep, Zeugma mozaikleri ve gastronomi kültürüyle Güneydoğu’nun vitrinidir.',
  Trabzon: 'Trabzon, Sümela Manastırı ve yeşil yaylalarıyla Karadeniz’in kültür ve doğa merkezidir.',
};
