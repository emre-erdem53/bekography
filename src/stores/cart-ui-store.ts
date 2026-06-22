import { create } from "zustand";

type CartUiState = {
  requestModalOpen: boolean;
  openRequestModal: () => void;
  closeRequestModal: () => void;
};

export const useCartUiStore = create<CartUiState>((set) => ({
  requestModalOpen: false,
  openRequestModal: () => set({ requestModalOpen: true }),
  closeRequestModal: () => set({ requestModalOpen: false }),
}));
