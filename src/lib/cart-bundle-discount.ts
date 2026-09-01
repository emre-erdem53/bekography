import type { ScheduleType } from "@/lib/package-types";

export const SECOND_PACKAGE_DISCOUNT_RATE = 0.1;

export const SECOND_PACKAGE_DISCOUNT_NOTE =
  "Dış çekim veya düğün salon paketlerine ek olarak tercih edilen ikinci pakette %10 indirim.";

const OUTDOOR_AREA_SLUGS = new Set(["dis-cekim"]);
const WEDDING_VENUE_AREA_SLUGS = new Set(["dugun-salon", "dugun"]);

const COMPANION_AREA_SLUGS = new Set(["gelin-cikisi", "kuafor"]);

export type CartDiscountItem = {
  cashPrice: number;
  installmentPrice: number;
  scheduleType?: ScheduleType;
  areaSlug: string;
  isCompanionOnly?: boolean;
};

function resolveIsCompanionOnly(
  areaSlug: string,
  explicit?: boolean,
): boolean {
  if (explicit !== undefined) return explicit;
  return COMPANION_AREA_SLUGS.has(areaSlug);
}

export function isSecondPackageDiscountAnchor(item: CartDiscountItem): boolean {
  if (resolveIsCompanionOnly(item.areaSlug, item.isCompanionOnly)) return false;
  if (item.scheduleType === "outdoor") return true;
  return (
    OUTDOOR_AREA_SLUGS.has(item.areaSlug) ||
    WEDDING_VENUE_AREA_SLUGS.has(item.areaSlug)
  );
}

/** İlk paket dış çekim/düğün salonu ise ikinci paket (index 1) indirimli. */
export function getSecondPackageDiscountIndex(
  items: CartDiscountItem[],
): number | null {
  if (items.length < 2) return null;
  if (!isSecondPackageDiscountAnchor(items[0])) return null;
  return 1;
}

export function applySecondPackageDiscount(price: number): number {
  return Math.round(price * (1 - SECOND_PACKAGE_DISCOUNT_RATE));
}

export function getCartItemEffectivePrices(
  item: CartDiscountItem,
  index: number,
  items: CartDiscountItem[],
): {
  cashPrice: number;
  installmentPrice: number;
  discountApplied: boolean;
} {
  const discountIndex = getSecondPackageDiscountIndex(items);
  if (discountIndex !== index) {
    return {
      cashPrice: item.cashPrice,
      installmentPrice: item.installmentPrice,
      discountApplied: false,
    };
  }

  return {
    cashPrice: applySecondPackageDiscount(item.cashPrice),
    installmentPrice: applySecondPackageDiscount(item.installmentPrice),
    discountApplied: true,
  };
}

export function getCartTotalsWithDiscount(items: CartDiscountItem[]) {
  let cash = 0;
  let installment = 0;
  let discountAppliedCount = 0;

  items.forEach((item, index) => {
    const effective = getCartItemEffectivePrices(item, index, items);
    cash += effective.cashPrice;
    installment += effective.installmentPrice;
    if (effective.discountApplied) discountAppliedCount += 1;
  });

  return { cash, installment, discountAppliedCount };
}

export function resolveRequestUnitPrice(
  basePrice: number,
  itemIndex: number,
  discountItems: CartDiscountItem[],
): number {
  const discountIndex = getSecondPackageDiscountIndex(discountItems);
  if (discountIndex !== itemIndex) return basePrice;
  return applySecondPackageDiscount(basePrice);
}
