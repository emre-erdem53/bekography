import { create } from "zustand";

type CartUiState = {
  requestModalOpen: boolean;
  companionWarningOpen: boolean;
  openRequestModal: () => void;
  closeRequestModal: () => void;
  showCompanionWarning: () => void;
  closeCompanionWarning: () => void;
};

export const useCartUiStore = create<CartUiState>((set) => ({
  requestModalOpen: false,
  companionWarningOpen: false,
  openRequestModal: () => set({ requestModalOpen: true }),
  closeRequestModal: () => set({ requestModalOpen: false }),
  showCompanionWarning: () => set({ companionWarningOpen: true }),
  closeCompanionWarning: () => set({ companionWarningOpen: false }),
}));
