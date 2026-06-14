import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  packageOptionId: string;
  categoryTitle: string;
  optionLabel: string;
  paymentType: "pesin" | "taksitli";
  unitPrice: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (packageOptionId: string, paymentType: CartItem["paymentType"]) => void;
  clearCart: () => void;
  getTotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const exists = state.items.some(
            (existing) =>
              existing.packageOptionId === item.packageOptionId &&
              existing.paymentType === item.paymentType,
          );
          if (exists) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (packageOptionId, paymentType) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.packageOptionId === packageOptionId &&
                item.paymentType === paymentType
              ),
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.unitPrice, 0),
    }),
    { name: "bekography-cart" },
  ),
);
