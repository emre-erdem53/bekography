/** Ad/soyad alanı: ilk harf her zaman büyük (tr-TR). */
export function enforcePersonNamePartInput(value: string): string {
  const trimmedLeading = value.replace(/^\s+/, "");
  if (!trimmedLeading) return value.startsWith(" ") ? " " : "";

  const firstChar = trimmedLeading.charAt(0).toLocaleUpperCase("tr-TR");
  const rest = trimmedLeading.slice(1);
  const leadingSpaces = value.slice(0, value.length - trimmedLeading.length);

  return `${leadingSpaces}${firstChar}${rest}`;
}

export function normalizePersonNamePartForStorage(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return enforcePersonNamePartInput(trimmed);
}
