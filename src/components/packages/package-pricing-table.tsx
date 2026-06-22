"use client";

import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import { PackageCartToggleButton } from "@/components/packages/package-cart-toggle-button";
import type { PackageCategoryData } from "@/lib/package-types";

export function PackagePricingTable({
  category,
}: {
  category: PackageCategoryData;
}) {
  const { options, accentColor } = category;
  const { labels, descriptions } = usePaymentTypeCopy();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 sm:grid-cols-2">
        {(["pesin", "taksitli"] as const).map((type) => (
          <div key={type}>
            <p className="text-sm font-semibold text-white">
              {labels[type]}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              ({descriptions[type]})
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-end gap-x-3 px-4 text-sm md:gap-x-4 md:px-5">
          <span />
          <div className="flex items-end gap-2 md:gap-2.5">
            <span
              className="w-[5.5rem] text-center text-[11px] leading-tight md:w-[6.5rem] md:text-xs"
              style={{ color: accentColor }}
            >
              {labels.pesin}
            </span>
            <span className="w-[5.5rem] text-center text-[11px] leading-tight text-zinc-500 md:w-[6.5rem] md:text-xs">
              {labels.taksitli}
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
                  className="w-[5.5rem] text-center text-sm font-bold tabular-nums md:w-[6.5rem] md:text-lg"
                  style={{ color: accentColor }}
                >
                  {formatPrice(option.cashPrice)}
                </span>
                <span className="w-[5.5rem] text-center text-sm font-bold tabular-nums text-zinc-500 md:w-[6.5rem] md:text-lg">
                  {formatPrice(option.installmentPrice)}
                </span>
              </div>
            </div>
            <PackageCartToggleButton
              category={category}
              option={option}
              variant="compact"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
