import type { CartItem } from "@/stores/cart-store";

/** Paketler yalnızca başka bir ana paketle birlikte talep edilebilir. */
export const COMPANION_ONLY_CATEGORY_SLUGS = [
  "gelin-cikisi",
  "kuafor",
] as const;

export type CompanionOnlyCategorySlug =
  (typeof COMPANION_ONLY_CATEGORY_SLUGS)[number];

export function isCompanionOnlyCategorySlug(
  slug: string,
): slug is CompanionOnlyCategorySlug {
  return COMPANION_ONLY_CATEGORY_SLUGS.includes(
    slug as CompanionOnlyCategorySlug,
  );
}

type CartSlugItem = Pick<CartItem, "categorySlug">;

export function cartRequiresAdditionalPackage(items: CartSlugItem[]): boolean {
  if (items.length === 0) return false;

  const hasCompanionOnly = items.some((item) =>
    isCompanionOnlyCategorySlug(item.categorySlug),
  );
  if (!hasCompanionOnly) return false;

  const hasPrimaryPackage = items.some(
    (item) => !isCompanionOnlyCategorySlug(item.categorySlug),
  );

  return !hasPrimaryPackage;
}

export function getCompanionRequirementMessage(): string {
  return "Gelin Çıkışı ve Kuaför paketleri tek başına talep edilemez. Sepetinize dış çekim, düğün veya başka bir ana paket daha ekleyin.";
}

export function canCreateRequestForItems(items: CartSlugItem[]): boolean {
  return items.length > 0 && !cartRequiresAdditionalPackage(items);
}

/** Eşlik paketi, sepette ana paket yokken sepete eklenemez. */
export function isCompanionOnlyAddBlocked(
  currentItems: CartSlugItem[],
  categorySlug: string,
): boolean {
  if (!isCompanionOnlyCategorySlug(categorySlug)) return false;
  return !currentItems.some(
    (item) => !isCompanionOnlyCategorySlug(item.categorySlug),
  );
}
