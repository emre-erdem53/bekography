"use client";

import { Minus, Plus } from "lucide-react";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { resolvePackageAccentColor } from "@/lib/package-types";
import {
  buildCartItemFromShootType,
  useCartStore,
} from "@/stores/cart-store";
import { isCompanionOnlyAddBlocked } from "@/lib/cart-companion-rules";
import { useCartUiStore } from "@/stores/cart-ui-store";

type PackageCartToggleButtonProps = {
  serviceArea: ServiceAreaData;
  pkg: PackageData;
  shootType: ShootTypeData;
  accentColor?: string;
  variant?: "full" | "compact" | "icon";
};

export function PackageCartToggleButton({
  serviceArea,
  pkg,
  shootType,
  accentColor: accentColorProp,
  variant = "full",
}: PackageCartToggleButtonProps) {
  const accentColor =
    accentColorProp ?? resolvePackageAccentColor(pkg, serviceArea);
  const inCart = useCartStore((state) =>
    state.items.some((item) => item.shootTypeId === shootType.id),
  );
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const showCompanionWarning = useCartUiStore(
    (state) => state.showCompanionWarning,
  );

  function handleClick() {
    if (inCart) {
      removeItem(shootType.id);
      return;
    }
    if (isCompanionOnlyAddBlocked(cartItems, serviceArea.isCompanionOnly)) {
      showCompanionWarning();
      return;
    }
    addItem(buildCartItemFromShootType(serviceArea, pkg, shootType));
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
                borderColor: `${accentColor}66`,
                color: accentColor,
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
          ? "flex w-full min-h-11 items-center justify-center rounded-2xl bg-red-500 py-2.5 text-xs font-semibold leading-none text-white transition-opacity hover:opacity-90 sm:min-h-12 sm:py-3.5 sm:text-sm"
          : "flex w-full min-h-11 items-center justify-center rounded-2xl bg-[#93f8b6] py-2.5 text-xs font-semibold leading-none text-black transition-opacity hover:opacity-90 sm:min-h-12 sm:py-3.5 sm:text-sm"
      }
    >
      <span className="inline-flex items-center justify-center gap-2">
        <span className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span>{inCart ? "Sepetten Çıkar" : "Sepete Ekle"}</span>
      </span>
    </button>
  );
}
