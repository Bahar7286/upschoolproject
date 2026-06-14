export type MessageLanguage = 'tr' | 'en';

/** Kullanıcı mesajından yanıt dili tahmini (basit heuristik). */
export function detectMessageLanguage(text: string): MessageLanguage {
  const sample = text.trim();
  if (!sample) return 'tr';

  const lower = sample.toLowerCase();
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  if (turkishChars.test(sample)) return 'tr';

  const trWords =
    /\b(ve|için|icin|gün|gun|nere|nasıl|nasil|merhaba|teşekkür|tesekkur|gezi|bütçe|butce|rotası|rotasi|ilçe|ilce|mekan|cami|müze|muze)\b/i;
  if (trWords.test(lower)) return 'tr';

  const enWords =
    /\b(the|and|for|what|where|how|days|day|budget|please|hello|hi|thanks|thank|trip|visit|museum|mosque|hotel|food|restaurant|guide|route|plan)\b/i;
  if (enWords.test(lower)) return 'en';

  if (/^[a-z0-9\s.,!?'"\-$€£%]+$/i.test(sample)) return 'en';

  return 'tr';
}
