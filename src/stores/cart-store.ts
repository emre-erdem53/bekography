import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { defaultRequestFieldLabels } from "@/lib/package-seed-data";
import { getShootTypeGalleryPreviewUrl } from "@/lib/package-media";

export type CartItem = {
  shootTypeId: string;
  shootTypeLabel: string;
  packageId: string;
  packageTitle: string;
  serviceAreaId: string;
  serviceAreaSlug: string;
  serviceAreaTitle: string;
  isCompanionOnly: boolean;
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
  removeItem: (shootTypeId: string) => void;
  toggleSelected: (shootTypeId: string) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  getTotalCash: () => number;
  getTotalInstallment: () => number;
  getSelectedItems: () => CartItem[];
};

export function buildCartItemFromShootType(
  serviceArea: ServiceAreaData,
  pkg: PackageData,
  shootType: ShootTypeData,
): CartItemInput {
  const labels =
    serviceArea.content.requestFieldLabels ??
    defaultRequestFieldLabels(serviceArea.title, serviceArea.scheduleType);

  return {
    shootTypeId: shootType.id,
    shootTypeLabel: shootType.label,
    packageId: pkg.id,
    packageTitle: pkg.title,
    serviceAreaId: serviceArea.id,
    serviceAreaSlug: serviceArea.slug,
    serviceAreaTitle: serviceArea.title,
    isCompanionOnly: serviceArea.isCompanionOnly,
    cashPrice: shootType.cashPrice,
    installmentPrice: shootType.installmentPrice,
    accentColor: pkg.accentColor || serviceArea.accentColor,
    imageUrl: getShootTypeGalleryPreviewUrl(shootType),
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
            (existing) => existing.shootTypeId === item.shootTypeId,
          );
          if (exists) return state;
          // Bir hizmet alanından sepette yalnızca tek çekim türü tutulur.
          const withoutSameServiceArea = state.items.filter(
            (existing) => existing.serviceAreaId !== item.serviceAreaId,
          );
          return {
            items: [
              ...withoutSameServiceArea,
              { ...item, selected: item.selected ?? true },
            ],
          };
        }),
      removeItem: (shootTypeId) =>
        set((state) => ({
          items: state.items.filter((item) => item.shootTypeId !== shootTypeId),
        })),
      toggleSelected: (shootTypeId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.shootTypeId === shootTypeId
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
      // v3 sepetleri farklı bir shape taşıdığı için key bump ile düşer.
      name: "bekography-cart-v4",
      skipHydration: true,
    },
  ),
);
