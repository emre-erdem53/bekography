"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  RequestActionLabel,
  requestActionSurfaceClass,
} from "@/components/packages/request-action-label";
import { canCreateRequestForItems } from "@/lib/cart-companion-rules";
import { useCartStore } from "@/stores/cart-store";
import { useCartUiStore } from "@/stores/cart-ui-store";

export const PACKAGE_CART_BAR_PATH = "/paketler";
export const PACKAGE_CART_PAGE_PATH = "/paketler/sepet";

/** `/paketler` ve tüm alt yolları (hizmet alanı sayfaları, sepet) sepet barını gösterir. */
export function isPackageCartBarRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === PACKAGE_CART_BAR_PATH ||
    pathname.startsWith(`${PACKAGE_CART_BAR_PATH}/`)
  );
}

export function isPackageCartPageRoute(pathname: string | null): boolean {
  return pathname === PACKAGE_CART_PAGE_PATH;
}

export function usePackageCartBarVisible(): boolean {
  const pathname = usePathname();
  return isPackageCartBarRoute(pathname);
}

export function useCartBottomInset(): string | undefined {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isPackageCartBarRoute(pathname) || items.length === 0) {
    return undefined;
  }

  const compact = isPackageCartPageRoute(pathname);
  return compact ? "pb-24" : getCartBottomPadding(items.length);
}

function getCartBarHeight(itemCount: number, compact = false): string {
  if (compact) return "4.5rem";
  if (itemCount <= 1) return "4.5rem";
  if (itemCount === 2) return "5.75rem";
  return "7rem";
}

function getCartBottomPadding(itemCount: number): string {
  if (itemCount <= 1) return "pb-28";
  if (itemCount === 2) return "pb-36";
  return "pb-44";
}

function CartBarIconBadge({ count }: { count: number }) {
  return (
    <span className="relative shrink-0">
      <ShoppingBag className="h-5 w-5 text-white" aria-hidden />
      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#93f8b6] px-1 text-[10px] font-bold leading-none text-black">
        {count}
      </span>
    </span>
  );
}

function CartBarItemList({
  items,
}: {
  items: Array<{
    shootTypeId: string;
    serviceAreaTitle: string;
    packageTitle: string;
    shootTypeLabel: string;
  }>;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <CartBarIconBadge count={items.length} />
      <ul className="min-w-0 flex-1 space-y-0.5">
        {items.map((item) => (
          <li
            key={item.shootTypeId}
            className="truncate text-[11px] leading-snug text-zinc-400 sm:text-xs"
          >
            <span className="text-zinc-500">• </span>
            {item.serviceAreaTitle} · {item.packageTitle} {item.shootTypeLabel}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Fixed bottom UI (modals, overlays) için sepet banner'ı üstüne padding. */
export function useCartOverlayBottomPadding(
  basePadding = "max(env(safe-area-inset-bottom), 1.75rem)",
): string {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isPackageCartBarRoute(pathname) || items.length === 0) {
    return basePadding;
  }

  const compact = isPackageCartPageRoute(pathname);
  return `calc(${basePadding} + ${getCartBarHeight(items.length, compact)})`;
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

  if (!mounted || !isPackageCartBarRoute(pathname) || items.length === 0) {
    return null;
  }

  const isCartPage = isPackageCartPageRoute(pathname);
  const canRequest = canCreateRequestForItems(
    selectedItems.length > 0 ? selectedItems : items,
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80]">
      <div className="border-t border-white/10 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:max-w-3xl sm:gap-4 sm:px-6 lg:max-w-4xl xl:max-w-5xl">
          {isCartPage ? (
            <CartBarIconBadge count={items.length} />
          ) : (
            <Link href={PACKAGE_CART_PAGE_PATH} className="min-w-0 flex-1">
              <CartBarItemList items={items} />
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
              href={PACKAGE_CART_PAGE_PATH}
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
