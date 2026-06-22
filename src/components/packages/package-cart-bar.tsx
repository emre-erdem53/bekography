"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { RequestActionLabel, requestActionSurfaceClass } from "@/components/packages/request-action-label";
import {
  canCreateRequestForItems,
  cartRequiresAdditionalPackage,
  getCompanionRequirementMessage,
} from "@/lib/cart-companion-rules";
import { useCartStore } from "@/stores/cart-store";
import { useCartUiStore } from "@/stores/cart-ui-store";

export function useCartBottomInset(): string | undefined {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return undefined;

  return cartRequiresAdditionalPackage(items) ? "pb-44" : "pb-28";
}

const CART_BAR_HEIGHT = "4.5rem";
const CART_COMPANION_NOTICE_HEIGHT = "2.75rem";

/** Fixed bottom UI (modals, overlays) için sepet banner'ı üstüne padding. */
export function useCartOverlayBottomPadding(
  basePadding = "max(env(safe-area-inset-bottom), 1.75rem)",
): string {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return basePadding;

  const noticeOffset = cartRequiresAdditionalPackage(items)
    ? ` + ${CART_COMPANION_NOTICE_HEIGHT}`
    : "";

  return `calc(${basePadding} + ${CART_BAR_HEIGHT}${noticeOffset})`;
}

export function PackageCartBar() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const selectedItems = useMemo(
    () => items.filter((item) => item.selected),
    [items],
  );
  const openRequestModal = useCartUiStore((state) => state.openRequestModal);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const isCartPage = pathname === "/paketler/sepet";
  const itemCount = items.length;
  const needsCompanion = cartRequiresAdditionalPackage(items);
  const canRequest = canCreateRequestForItems(
    selectedItems.length > 0 ? selectedItems : items,
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80]">
      {needsCompanion ? (
        <div className="border-t border-amber-400/25 bg-amber-950/95 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-100 backdrop-blur-md sm:px-6 sm:text-sm">
          {getCompanionRequirementMessage()}
        </div>
      ) : null}

      <div className="border-t border-white/10 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:max-w-3xl sm:px-6 lg:max-w-4xl xl:max-w-5xl">
          {isCartPage ? (
            <div className="flex min-w-0 items-center gap-2.5 text-white">
              <span className="relative shrink-0">
                <ShoppingBag className="h-5 w-5" aria-hidden />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#93f8b6] px-1 text-[10px] font-bold leading-none text-black">
                  {itemCount}
                </span>
              </span>
              <span className="truncate text-sm font-medium">
                Sepetim{" "}
                <span className="text-zinc-400">({itemCount} ürün)</span>
              </span>
            </div>
          ) : (
            <Link
              href="/paketler/sepet"
              className="flex min-w-0 items-center gap-2.5 text-white"
            >
              <span className="relative shrink-0">
                <ShoppingBag className="h-5 w-5" aria-hidden />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#93f8b6] px-1 text-[10px] font-bold leading-none text-black">
                  {itemCount}
                </span>
              </span>
              <span className="truncate text-sm font-medium">
                Sepetim{" "}
                <span className="text-zinc-400">({itemCount} ürün)</span>
              </span>
            </Link>
          )}

          {isCartPage ? (
            <button
              type="button"
              onClick={openRequestModal}
              disabled={!canRequest}
              className={`${requestActionSurfaceClass} shrink-0 rounded-2xl bg-[#93f8b6] px-6 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45`}
            >
              <RequestActionLabel>Talep Oluştur</RequestActionLabel>
            </button>
          ) : (
            <Link
              href="/paketler/sepet"
              className={`${requestActionSurfaceClass} shrink-0 rounded-2xl bg-[#93f8b6] px-6 py-3 text-sm font-semibold text-black`}
            >
              Sepete Git
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
