"use client";

import { Minus, Plus } from "lucide-react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import {
  buildCartItemFromCategory,
  useCartStore,
} from "@/stores/cart-store";

type PackageCartToggleButtonProps = {
  category: PackageCategoryData;
  option: PackageOptionData;
  variant?: "full" | "compact" | "icon";
};

export function PackageCartToggleButton({
  category,
  option,
  variant = "full",
}: PackageCartToggleButtonProps) {
  const inCart = useCartStore((state) =>
    state.items.some((item) => item.packageOptionId === option.id),
  );
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);

  function handleClick() {
    if (inCart) {
      removeItem(option.id);
      return;
    }
    addItem(buildCartItemFromCategory(category, option));
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={inCart ? "Sepetten çıkar" : "Sepete ekle"}
        className={
          inCart
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-400 sm:h-9 sm:w-9"
            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-white/5 sm:h-9 sm:w-9"
        }
        style={
          inCart
            ? undefined
            : {
                borderColor: `${category.accentColor}66`,
                color: category.accentColor,
              }
        }
      >
        {inCart ? (
          <Minus className="h-4 w-4 stroke-[2.5]" aria-hidden />
        ) : (
          <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden />
        )}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={
          inCart
            ? "rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/25 hover:text-red-300"
            : "rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black"
        }
      >
        {inCart ? "Sepetten Çıkar" : "Sepete Ekle"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        inCart
          ? "w-full rounded-2xl bg-red-500 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:py-3.5 sm:text-sm"
          : "w-full rounded-2xl bg-[#93f8b6] py-2.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 sm:py-3.5 sm:text-sm"
      }
    >
      {inCart ? "Sepetten Çıkar" : "Sepete Ekle"}
    </button>
  );
}
