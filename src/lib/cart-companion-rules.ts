/**
 * Eşlik paketleri (ör. Gelin Çıkışı, Kuaför) tek başına talep edilemez.
 * Kural artık hizmet alanının `isCompanionOnly` bayrağından okunuyor; slug
 * listesi hard-code edilmiyor.
 */
type CompanionFlagItem = { isCompanionOnly: boolean };

export function cartRequiresAdditionalPackage(
  items: CompanionFlagItem[],
): boolean {
  if (items.length === 0) return false;

  const hasCompanionOnly = items.some((item) => item.isCompanionOnly);
  if (!hasCompanionOnly) return false;

  return !items.some((item) => !item.isCompanionOnly);
}

export function getCompanionRequirementMessage(): string {
  return "Eşlik paketleri tek başına talep edilemez. Sepetinize dış çekim, düğün veya başka bir ana paket daha ekleyin.";
}

export function canCreateRequestForItems(items: CompanionFlagItem[]): boolean {
  return items.length > 0 && !cartRequiresAdditionalPackage(items);
}

/** Eşlik paketi, sepette ana paket yokken sepete eklenemez. */
export function isCompanionOnlyAddBlocked(
  currentItems: CompanionFlagItem[],
  isCompanionOnly: boolean,
): boolean {
  if (!isCompanionOnly) return false;
  return !currentItems.some((item) => !item.isCompanionOnly);
}
