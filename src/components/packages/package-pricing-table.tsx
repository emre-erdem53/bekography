"use client";

import { formatPrice } from "@/lib/constants";
import type { PackageCategoryData } from "@/lib/package-types";
import {
  buildCartItemFromCategory,
  useCartStore,
} from "@/stores/cart-store";

export function PackagePricingTable({
  category,
}: {
  category: PackageCategoryData;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const { options, accentColor } = category;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 px-4 text-sm font-semibold md:gap-x-4 md:px-5 md:text-base">
        <span />
        <div className="flex items-center gap-2 md:gap-2.5">
          <span
            className="w-[4.75rem] text-center md:w-[5.25rem]"
            style={{ color: accentColor }}
          >
            Peşin
          </span>
          <span className="w-[4.75rem] text-center text-zinc-500 md:w-[5.25rem]">
            Taksitli
          </span>
        </div>
      </div>
      {options.map((option) => (
        <div
          key={option.id}
          className="space-y-2 rounded-2xl bg-[#1c1c1c] px-4 py-3 md:px-5"
        >
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 md:gap-x-4">
            <span
              className="min-w-0 text-sm font-bold leading-tight md:text-base"
              style={{ color: accentColor }}
            >
              {option.label}
            </span>
            <div className="flex items-center gap-2 md:gap-2.5">
              <span
                className="w-[4.75rem] text-center text-sm font-bold tabular-nums md:w-[5.25rem] md:text-lg"
                style={{ color: accentColor }}
              >
                {formatPrice(option.cashPrice)}
              </span>
              <span className="w-[4.75rem] text-center text-sm font-bold tabular-nums text-zinc-500 md:w-[5.25rem] md:text-lg">
                {formatPrice(option.installmentPrice)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => addItem(buildCartItemFromCategory(category, option))}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black"
          >
            Sepete Ekle
          </button>
        </div>
      ))}
    </div>
  );
}
