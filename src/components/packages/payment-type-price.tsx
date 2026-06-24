"use client";

import { formatPrice, type PaymentType } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type PaymentTypePriceProps = {
  type: PaymentType;
  price: number;
  variant?: "stacked" | "compact" | "minimal";
  align?: "left" | "right";
  className?: string;
};

export function PaymentTypePrice({
  type,
  price,
  variant = "stacked",
  align = "left",
  className = "",
}: PaymentTypePriceProps) {
  const { labels, descriptions } = usePaymentTypeCopy();
  const label = labels[type];
  const description = descriptions[type];
  const emphasized = type === "pesin";
  const alignClass = align === "right" ? "text-right" : "text-left";

  const priceClass = emphasized
    ? "font-bold text-white"
    : "font-semibold text-zinc-500";

  if (variant === "minimal") {
    return (
      <div className={`${alignClass} ${className}`}>
        <p className="text-[10px] text-zinc-500 sm:text-xs">{label}</p>
        <p className={`text-xs sm:text-sm ${priceClass}`}>{formatPrice(price)}</p>
        <p className="mt-0.5 hidden max-w-[9rem] text-[9px] leading-tight text-zinc-600 sm:block">
          {description}
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`${alignClass} ${className}`}>
        <p className="text-[11px] text-zinc-500 sm:text-xs">{label}</p>
        <p className={`text-base sm:text-lg ${priceClass}`}>
          {formatPrice(price)}
        </p>
        <p className="mt-0.5 hidden text-[10px] leading-tight text-zinc-600 sm:block">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className={`${alignClass} ${className}`}>
      <p className="text-[11px] font-medium text-zinc-400 sm:text-xs">{label}</p>
      <p className={`mt-0.5 text-lg sm:text-xl ${priceClass}`}>
        {formatPrice(price)}
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-zinc-600 sm:text-[11px]">
        {description}
      </p>
    </div>
  );
}

export function PaymentTypeOptionButton({
  type,
  price,
  selected,
  onSelect,
}: {
  type: PaymentType;
  price: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { labels, descriptions } = usePaymentTypeCopy();
  const label = labels[type];
  const description = descriptions[type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 flex-col rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-[#93f8b6] bg-[#93f8b6] text-black"
          : "border-white/20 text-zinc-400"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        {!selected ? (
          <span className="shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
            Seç
          </span>
        ) : null}
      </span>
      <span
        className={`mt-1 block text-sm font-bold ${
          selected ? "text-black" : "text-white"
        }`}
      >
        {formatPrice(price)}
      </span>
      <span
        className={`mt-1 block text-[10px] leading-snug ${
          selected ? "text-zinc-700" : "text-zinc-500"
        }`}
      >
        {description}
      </span>
    </button>
  );
}
