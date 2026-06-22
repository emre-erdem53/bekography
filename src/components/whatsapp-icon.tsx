import Image from "next/image";

type WhatsAppIconProps = {
  className?: string;
  variant?: "brand" | "monochrome" | "onDark";
};

export function WhatsAppIcon({
  className = "h-[18px] w-[18px]",
  variant = "brand",
}: WhatsAppIconProps) {
  const toneClass =
    variant === "monochrome"
      ? "brightness-0"
      : variant === "onDark"
        ? "brightness-0 invert"
        : "";

  return (
    <Image
      src="/whatsapp.svg"
      alt=""
      width={18}
      height={18}
      aria-hidden
      className={`shrink-0 ${toneClass} ${className}`.trim()}
    />
  );
}
