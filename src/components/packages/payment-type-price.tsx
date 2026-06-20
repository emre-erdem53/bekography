import {
  PAYMENT_TYPE_DESCRIPTIONS,
  PAYMENT_TYPE_LABELS,
  formatPrice,
  type PaymentType,
} from "@/lib/constants";

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
  const label = PAYMENT_TYPE_LABELS[type];
  const description = PAYMENT_TYPE_DESCRIPTIONS[type];
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
          ({description})
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
          ({description})
        </p>
      </div>
    );
  }

  return (
    <div className={`${alignClass} ${className}`}>
      <p className="text-[11px] font-medium text-zinc-400 sm:text-xs">{label}</p>
      <p className="text-[10px] leading-snug text-zinc-600 sm:text-[11px]">
        ({description})
      </p>
      <p className={`mt-0.5 text-lg sm:text-xl ${priceClass}`}>
        {formatPrice(price)}
      </p>
    </div>
  );
}

export function PaymentTypeOptionButton({
  type,
  selected,
  onSelect,
}: {
  type: PaymentType;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 rounded-lg border px-3 py-2.5 text-left ${
        selected
          ? "border-white bg-white text-black"
          : "border-white/20 text-zinc-400"
      }`}
    >
      <span className="block text-xs font-semibold">
        {PAYMENT_TYPE_LABELS[type]}
      </span>
      <span
        className={`mt-1 block text-[10px] leading-snug ${
          selected ? "text-zinc-600" : "text-zinc-500"
        }`}
      >
        ({PAYMENT_TYPE_DESCRIPTIONS[type]})
      </span>
    </button>
  );
}
