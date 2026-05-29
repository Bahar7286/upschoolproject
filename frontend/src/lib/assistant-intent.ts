const GREETING =
  /^(selam|slm|slmm|merhaba|mrb|hey|hi|hello|günaydın|gunaydin|iyi günler|iyi akşamlar|naber|nbr|sa)\s*[!.?]*$/i;
const THANKS = /^(teşekkür(ler)?|tesekkur(ler)?|sağol|sagol|eyv|thanks|thank you)\s*[!.?]*$/i;

function isShortGreeting(text: string): boolean {
  const t = text.trim();
  if (t.length <= 5 && /^(slm|sel|hey|hi|mrb|sa)$/i.test(t)) return true;
  return GREETING.test(t);
}

export function getQuickAssistantReply(text: string, city: string, district = ''): string | null {
  const where = district ? `${district}, ${city}` : city;
  if (isShortGreeting(text)) {
    return (
      `Selam! 👋 Ben Historial-GO asistanıyım. ` +
      `${where} veya başka bir il için gezi planı istersen kaç günün olduğunu ` +
      `ve ilgi alanını (tarih, yemek, müze…) yazman yeterli.`
    );
  }
  if (THANKS.test(text.trim())) {
    return 'Rica ederim! Başka bir sorunda yazabilirsin.';
  }
  return null;
}
