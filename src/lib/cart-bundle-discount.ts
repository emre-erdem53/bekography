import { startOfDay } from "date-fns";
import type { ScheduleType } from "@/lib/package-types";

export const SECOND_PACKAGE_DISCOUNT_RATE = 0.1;

export const SECOND_PACKAGE_DISCOUNT_NOTE =
  ". Dış Çekim veya Salon Paketlerine eklenen her paket için %10 indirim";

export const SEASONAL_CAMPAIGN_DISCOUNT_RATE = 0.2;

export const SEASONAL_CAMPAIGN_START = "2026-12-01";
export const SEASONAL_CAMPAIGN_END = "2027-03-01";

export const SEASONAL_CAMPAIGN_NOTE =
  ". 1 Aralık - 1 Mart tarihleri arasındaki çekimlerde +%20 İndirim";

const OUTDOOR_AREA_SLUGS = new Set(["dis-cekim"]);
const WEDDING_VENUE_AREA_SLUGS = new Set(["dugun-salon", "dugun"]);

const COMPANION_AREA_SLUGS = new Set(["gelin-cikisi", "kuafor"]);

const SEASONAL_START = startOfDay(new Date(SEASONAL_CAMPAIGN_START));
const SEASONAL_END = startOfDay(new Date(SEASONAL_CAMPAIGN_END));

export type CartDiscountItem = {
  cashPrice: number;
  installmentPrice: number;
  scheduleType?: ScheduleType;
  areaSlug: string;
  isCompanionOnly?: boolean;
  /** YYYY-MM-DD — sezon indirimi için çekim tarihi. */
  shootDate?: string;
};

export type CartItemEffectivePrices = {
  cashPrice: number;
  installmentPrice: number;
  discountApplied: boolean;
  bundleDiscountApplied: boolean;
  seasonalDiscountApplied: boolean;
};

function resolveIsCompanionOnly(
  areaSlug: string,
  explicit?: boolean,
): boolean {
  if (explicit !== undefined) return explicit;
  return COMPANION_AREA_SLUGS.has(areaSlug);
}

export function isSeasonalCampaignDate(
  shootDate: string | Date | undefined | null,
): boolean {
  if (!shootDate) return false;

  const normalized =
    typeof shootDate === "string"
      ? startOfDay(new Date(`${shootDate}T12:00:00`))
      : startOfDay(shootDate);

  if (Number.isNaN(normalized.getTime())) return false;

  return normalized >= SEASONAL_START && normalized <= SEASONAL_END;
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

export function applySeasonalCampaignDiscount(price: number): number {
  return Math.round(price * (1 - SEASONAL_CAMPAIGN_DISCOUNT_RATE));
}

function applyItemDiscounts(
  price: number,
  options: {
    bundleDiscount: boolean;
    seasonalDiscount: boolean;
  },
): number {
  let result = price;
  if (options.bundleDiscount) {
    result = applySecondPackageDiscount(result);
  }
  if (options.seasonalDiscount) {
    result = applySeasonalCampaignDiscount(result);
  }
  return result;
}

export function getCartItemEffectivePrices(
  item: CartDiscountItem,
  index: number,
  items: CartDiscountItem[],
): CartItemEffectivePrices {
  const bundleDiscount = getSecondPackageDiscountIndex(items) === index;
  const seasonalDiscount = isSeasonalCampaignDate(item.shootDate);

  if (!bundleDiscount && !seasonalDiscount) {
    return {
      cashPrice: item.cashPrice,
      installmentPrice: item.installmentPrice,
      discountApplied: false,
      bundleDiscountApplied: false,
      seasonalDiscountApplied: false,
    };
  }

  return {
    cashPrice: applyItemDiscounts(item.cashPrice, {
      bundleDiscount,
      seasonalDiscount,
    }),
    installmentPrice: applyItemDiscounts(item.installmentPrice, {
      bundleDiscount,
      seasonalDiscount,
    }),
    discountApplied: true,
    bundleDiscountApplied: bundleDiscount,
    seasonalDiscountApplied: seasonalDiscount,
  };
}

export function getCartTotalsWithDiscount(items: CartDiscountItem[]) {
  let cash = 0;
  let installment = 0;
  let discountAppliedCount = 0;
  let seasonalDiscountAppliedCount = 0;

  items.forEach((item, index) => {
    const effective = getCartItemEffectivePrices(item, index, items);
    cash += effective.cashPrice;
    installment += effective.installmentPrice;
    if (effective.discountApplied) discountAppliedCount += 1;
    if (effective.seasonalDiscountApplied) seasonalDiscountAppliedCount += 1;
  });

  return {
    cash,
    installment,
    discountAppliedCount,
    seasonalDiscountAppliedCount,
  };
}

export function resolveRequestUnitPrice(
  basePrice: number,
  itemIndex: number,
  discountItems: CartDiscountItem[],
): number {
  const item = discountItems[itemIndex];
  if (!item) return basePrice;

  const bundleDiscount = getSecondPackageDiscountIndex(discountItems) === itemIndex;
  const seasonalDiscount = isSeasonalCampaignDate(item.shootDate);

  return applyItemDiscounts(basePrice, { bundleDiscount, seasonalDiscount });
}
