"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
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
      <div className="mx-auto flex w-full max-w-2xl items-end justify-between gap-4 px-4 py-3 sm:max-w-3xl sm:items-center sm:px-6 lg:max-w-4xl xl:max-w-5xl">
        <div className="grid min-w-0 grid-cols-2 gap-x-4">
          <PaymentTypePrice
            type="pesin"
            price={getTotalCash()}
            variant="compact"
          />
          <PaymentTypePrice
            type="taksitli"
            price={getTotalInstallment()}
            variant="compact"
            align="right"
          />
        </div>

        {showRequestAction || isCartPage ? (
          <button
            type="button"
            onClick={onRequestClick}
            className="shrink-0 rounded-2xl bg-[#93f8b6] px-6 py-3 text-sm font-semibold text-black"
          >
            Talep Oluştur
          </button>
        ) : (
          <Link
            href="/paketler/sepet"
            className="shrink-0 rounded-2xl bg-[#93f8b6] px-6 py-3 text-sm font-semibold text-black"
          >
            Sepete Git
          </Link>
        )}
      </div>
    </div>
  );
}
