import Image from "next/image";

type WhatsAppIconProps = {
  className?: string;
  /** @deprecated Full-color SVG; filters are no longer applied. */
  variant?: "brand" | "monochrome" | "onDark";
};

export function WhatsAppIcon({
  className = "h-[18px] w-[18px]",
}: WhatsAppIconProps) {
  return (
    <Image
      src="/whatsapp.svg"
      alt=""
      width={18}
      height={18}
      aria-hidden
      unoptimized
      className={`shrink-0 ${className}`.trim()}
    />
  );
}
