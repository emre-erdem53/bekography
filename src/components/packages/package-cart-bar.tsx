"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice } from "@/lib/constants";
import { useCartStore } from "@/stores/cart-store";

type PackageCartBarProps = {
  showRequestAction?: boolean;
  onRequestClick?: () => void;
};

export function PackageCartBar({
  showRequestAction = false,
  onRequestClick,
}: PackageCartBarProps) {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const getTotalCash = useCartStore((state) => state.getTotalCash);
  const getTotalInstallment = useCartStore((state) => state.getTotalInstallment);

  if (items.length === 0) return null;

  const isCartPage = pathname === "/paketler/sepet";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:max-w-3xl sm:px-6 lg:max-w-4xl xl:max-w-5xl">
        <div>
          <p className="text-xs text-zinc-500">Toplam</p>
          <p className="text-lg font-bold text-white">
            {formatPrice(getTotalCash())}
          </p>
          <p className="text-sm text-zinc-500">
            {formatPrice(getTotalInstallment())}
          </p>
        </div>

        {showRequestAction || isCartPage ? (
          <button
            type="button"
            onClick={onRequestClick}
            className="rounded-2xl bg-[#93f8b6] px-6 py-3 text-sm font-semibold text-black"
          >
            Talep Oluştur
          </button>
        ) : (
          <Link
            href="/paketler/sepet"
            className="rounded-2xl bg-[#93f8b6] px-6 py-3 text-sm font-semibold text-black"
          >
            Sepete Git
          </Link>
        )}
      </div>
    </div>
  );
}
