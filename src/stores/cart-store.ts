import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackageCategoryData, ScheduleType } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { defaultRequestFieldLabels } from "@/lib/package-seed-data";
import { getOptionGalleryPreviewUrl } from "@/lib/package-media";
import {
  getCartItemEffectivePrices,
  getCartTotalsWithDiscount,
  type CartDiscountItem,
} from "@/lib/cart-bundle-discount";

export type CartItem = {
  packageOptionId: string;
  categoryId: string;
  categorySlug: string;
  categoryTitle: string;
  optionLabel: string;
  scheduleType: ScheduleType;
  cashPrice: number;
  installmentPrice: number;
  accentColor: string;
  imageUrl: string | null;
  dateLabel: string;
  cityLabel: string;
  selected: boolean;
};

export type CartItemInput = Omit<CartItem, "selected"> & { selected?: boolean };

type CartState = {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  removeItem: (packageOptionId: string) => void;
  toggleSelected: (packageOptionId: string) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  getTotalCash: () => number;
  getTotalInstallment: () => number;
  getSelectedItems: () => CartItem[];
};

export function buildCartItemFromCategory(
  category: PackageCategoryData,
  option: PackageCategoryData["options"][number],
): CartItemInput {
  const content = category.content as PackageCategoryContent;
  const labels =
    content.requestFieldLabels ??
    defaultRequestFieldLabels(
      category.title,
      content.scheduleType ?? "indoor",
    );

  return {
    packageOptionId: option.id,
    categoryId: category.id,
    categorySlug: category.slug,
    categoryTitle: category.title,
    optionLabel: option.label,
    scheduleType: content.scheduleType ?? "indoor",
    cashPrice: option.cashPrice,
    installmentPrice: option.installmentPrice,
    accentColor: category.accentColor,
    imageUrl: getOptionGalleryPreviewUrl(category, option.id, option.label),
    dateLabel: labels.dateLabel,
    cityLabel: labels.cityLabel,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const exists = state.items.some(
            (existing) => existing.packageOptionId === item.packageOptionId,
          );
          if (exists) return state;
          const withoutSameCategory = state.items.filter(
            (existing) => existing.categoryId !== item.categoryId,
          );
          return {
            items: [
              ...withoutSameCategory,
              { ...item, selected: item.selected ?? true },
            ],
          };
        }),
      removeItem: (packageOptionId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.packageOptionId !== packageOptionId,
          ),
        })),
      toggleSelected: (packageOptionId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.packageOptionId === packageOptionId
              ? { ...item, selected: !item.selected }
              : item,
          ),
        })),
      selectAll: (selected) =>
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        })),
      clearCart: () => set({ items: [] }),
      getTotalCash: () =>
        getCartTotalsWithDiscount(getSelectedDiscountItems(get().items)).cash,
      getTotalInstallment: () =>
        getCartTotalsWithDiscount(getSelectedDiscountItems(get().items))
          .installment,
      getSelectedItems: () => get().items.filter((item) => item.selected),
    }),
    {
      name: "bekography-cart-v4",
      skipHydration: true,
    },
  ),
);

function toDiscountItem(item: CartItem): CartDiscountItem {
  return {
    cashPrice: item.cashPrice,
    installmentPrice: item.installmentPrice,
    scheduleType: item.scheduleType,
    areaSlug: item.categorySlug,
  };
}

function getSelectedDiscountItems(items: CartItem[]): CartDiscountItem[] {
  return items.filter((item) => item.selected).map(toDiscountItem);
}

export function getCartItemDiscountPrices(item: CartItem, items: CartItem[]) {
  const discountItems = items.map(toDiscountItem);
  const index = items.findIndex(
    (entry) => entry.packageOptionId === item.packageOptionId,
  );
  return getCartItemEffectivePrices(toDiscountItem(item), index, discountItems);
}
