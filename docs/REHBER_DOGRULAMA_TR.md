# Türkiye’de turist rehberi olma şartları (Historial-GO doğrulama tasarımı)

## Yasal çerçeve

- **6326 sayılı Turist Rehberliği Meslek Kanunu** (2024 güncellemeleri ile)
- **Turist Rehberliği Meslek Yönetmeliği** (ruhsatname, çalışma kartı, oda üyeliği)
- Hizmeti fiilen icra eden: **çalışma kartı** sahibi **eylemli turist rehberi**

## Kim rehber olabilir? (özet)

| Koşul | Açıklama |
|--------|----------|
| Eğitim | Turist rehberliği bölümü mezunu **veya** en az lisans + Bakanlık onaylı ülkesel/bölgesel eğitim programı |
| Yabancı dil | Çoğu dilde YDS/eşdeğer **en az 75 puan** (Türkçe rehberlik için ayrı yol) |
| Sınav | Mesleğe kabul sınavı (kamu/kuruluşlarca) |
| Ruhsatname | Kültür ve Turizm Bakanlığı |
| Çalışma kartı | TUREB / ilgili oda — **1 yıl geçerli**, mesleği fiilen icra |
| Oda üyeliği | Ruhsatname sonrası zorunlu süreç |

**Sonuç:** Herkes “rehber” olamaz; platformda yalnızca **doğrulama sürecinden geçen** hesaplar turiste listelenir.

## Historial-GO’da güven nasıl gösterilir?

1. **Durum:** `pending` → `under_review` → `verified` / `rejected`
2. **Kokart / ruhsat no** (manuel inceleme + ileride belge yükleme)
3. **Üniversite & bölüm** (Turist Rehberliği, Arkeoloji, Sanat Tarihi vb.)
4. **Diller & bölgeler** (çalışma kartı ile uyumlu)
5. **Onaylı rozet** yalnızca `verified` rehberlerde
6. **İletişim:** Teklifler platform üzerinden (`/quotes`) — WhatsApp/e-posta paylaşımı teşvik edilmez

## Grup fiyatlandırma

- Turist teklif formunda **grup kişi sayısı** girer
- Rehber **toplam teklif** verir; sistem kişi başı ve **%15 platform komisyonu** özetini mesaja ekler
- Rehber profilinde `min_group_size` / `max_group_size` sınırları

## API uçları

| Uç | Kim |
|----|-----|
| `POST /guides/me/verification` | Rehber başvuru |
| `GET /guides/marketplace` | Turist — onaylı liste |
| `GET /guides/{id}/public` | Turist — profil |
| `POST /quotes` | Turist — teklif |
| `GET /quotes/inbox` | Rehber |
| `PATCH /quotes/{id}/respond` | Rehber |
