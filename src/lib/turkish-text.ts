/** CSS `uppercase` Türkçe İ/ı kurallarını bozar; etiketler için güvenli büyük harf. */
export function turkishUppercase(text: string): string {
  return text.toLocaleUpperCase("tr-TR");
}
