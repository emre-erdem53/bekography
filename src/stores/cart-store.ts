import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { defaultRequestFieldLabels } from "@/lib/package-seed-data";
import { getOptionGalleryPreviewUrl } from "@/lib/package-media";

export type CartItem = {
  packageOptionId: string;
  categoryId: string;
  categorySlug: string;
  categoryTitle: string;
  optionLabel: string;
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
          return {
            items: [
              ...state.items,
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
        get()
          .items.filter((item) => item.selected)
          .reduce((sum, item) => sum + item.cashPrice, 0),
      getTotalInstallment: () =>
        get()
          .items.filter((item) => item.selected)
          .reduce((sum, item) => sum + item.installmentPrice, 0),
      getSelectedItems: () => get().items.filter((item) => item.selected),
    }),
    {
      name: "bekography-cart-v3",
      skipHydration: true,
    },
  ),
);
