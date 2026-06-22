type WhatsAppIconProps = {
  className?: string;
  /** @deprecated Kept for API compatibility; full-color SVG is always shown. */
  variant?: "brand" | "monochrome" | "onDark";
};

export function WhatsAppIcon({
  className = "h-[18px] w-[18px]",
}: WhatsAppIconProps) {
  return (
    // Plain img — Next/Image can break SVG gradients and xlink references.
    <img
      src="/whatsapp.svg"
      alt=""
      width={18}
      height={18}
      aria-hidden
      className={`shrink-0 ${className}`.trim()}
      decoding="async"
    />
  );
}
