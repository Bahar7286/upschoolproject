
# 1. ÖZET (MVP'NİN ÖZÜ)

**Historial-GO**, turizm sektöründe deneyim ekonomisini dijitalleştiren **B2B2C** bir pazaryeridir. MVP (Minimum Uygulanabilir Ürün) aşamasında hedefimiz; İstanbul odağında, turistlerin kişisel ilgi alanlarına göre rota oluşturup keşif yapabildiği, rehberlerin ise bu dijital içeriklerden pasif gelir elde ettiği sistemi 90 gün içinde doğrulamaktır.

# 2. MVP KAPSAMI: NELER OLACAK?

### **2.1. Kullanıcı Deneyimi (B2C)**
* **Akıllı Onboarding:** Kullanıcının ilgi alanlarını (Tarih, Sanat, Gastronomi vb.) seçtiği ve profilini oluşturduğu hızlı giriş süreci.
* **AI Destekli Rota Önerisi:** Kullanıcının seçtiği ilgi alanına, rasgele ayırabileceği bütçeye ve sahip olduğu zamana (30 dk, 2 saat, tam gün) göre en uygun 5 rotanın yapay zeka tarafından listelenmesi.
* **İnteraktif Şehir Haritası:** 50'den fazla tarihi lokasyonun markerlar ile gösterildiği, navigasyon destekli canlı harita.
* **Sesli Rehberlik (TTS):** Her lokasyon için 3 dilde (TR, EN, DE) yapay zeka tarafından seslendirilmiş profesyonel anlatımlar.
* **Oyunlaştırma (Gamification):** Gezdikçe kazanılan "Kültür Puanları", tamamlanan rotalarla açılan rozetler (Tarih Meraklısı, Şehir Gezgini vb.) ve haftalık liderlik tablosu.

### **2.2. Rehber Platformu (B2B)**
* **Dijital Rota Oluşturma:** Rehberlerin harita üzerinden durak seçip anlatım metni ve fotoğraf yükleyerek kendi ücretli rotalarını oluşturabilmesi.
* **Gelir Paneli:** Satılan rotalardan elde edilen kazancın takibi ve banka hesabına transfer talebi (Payout).
* **Performans Analitiği:** Rotaların kaç kez görüntülendiği, kullanıcı yorumları ve yıldız puanlarının takibi.

# 3. TEKNİK MİMARİ VE ÇALIŞMA MANTIĞI

Uygulama, hem online hem de kısıtlı offline ortamlarda çalışacak şekilde hibrit bir mimariyle kurgulanmıştır.

* **Teknoloji Yığını:** Mobil tarafta **React Native** (iOS/Android), arka planda **Node.js** ve veri yönetiminde **PostgreSQL** kullanılacaktır.
* **Ödeme Sistemi:** Güvenli ödeme altyapısı için **Stripe** entegrasyonu ile kredi kartı tahsilatları ve rehber hak edişleri yönetilecektir.
* **Yapay Zeka Katmanı:** Rota öneri algoritması, benzer kullanıcı davranışlarını analiz ederek kişiselleştirilmiş "Size Özel" listeler sunacaktır.
* **Offline Erişilebilirlik:** Satın alınan rotalar; harita verisi, ses dosyaları ve fotoğraflar dahil olmak üzere cihaz hafızasına önceden indirilecektir (Yaklaşık 40-50 MB).

# 4. KRİTİK İŞ AKIŞLARI

### **4.1. Satın Alma ve Kullanım Akışı**
1.  Kullanıcı ilgi alanına göre bir rota seçer (Örn: "Osmanlı Mimari Turu" - 80 TL).
2.  Ödeme sonrası rota verileri cihazına iner.
3.  Kullanıcı mekana (Geofence) 20 metre yaklaştığında sesli rehberlik otomatik tetiklenir.
4.  Rota bitiminde kullanıcı puan kazanır ve rozeti profiline eklenir.

### **4.2. Gelir Paylaşımı**
* **Komisyon Oranı:** %15 Platform / %85 Rehber.
* Örnek: 100 TL'lik bir satışta 85 TL rehberin bakiyesine, 15 TL platform işletme giderlerine aktarılır.

# 5. 90 GÜNLÜK GELİŞTİRME TAKVİMİ (Sprints)

* **1-2. Hafta (Temeller):** Sunucu kurulumu, kullanıcı kayıt sistemleri ve veritabanı yapısının kurulması.
* **3-6. Hafta (Core Ürün):** Rota oluşturma araçları, Google Maps entegrasyonu ve Stripe ödeme sisteminin devreye alınması.
* **7-10. Hafta (Zenginleştirme):** Sesli rehberlik üretimi (TTS), oyunlaştırma motoru ve mobil uygulama arayüzünün (UI/UX) son hali.
* **11-13. Hafta (Test & Lansman):** İstanbul'da 100 kişilik beta grubuyla testler, hata düzeltmeleri ve uygulama mağazalarına (App Store/Play Store) gönderim.
