"use client";

import { RequestModal } from "@/components/packages/request-modal";
import { useCartUiStore } from "@/stores/cart-ui-store";

export function GlobalCartRequestModal() {
  const open = useCartUiStore((state) => state.requestModalOpen);
  const close = useCartUiStore((state) => state.closeRequestModal);

  return <RequestModal open={open} onClose={close} />;
}
