import Link from "next/link";

type BekographyBrandProps = {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  className?: string;
};

export function BekographyBrand({
  size = "md",
  href = "/",
  className = "",
}: BekographyBrandProps) {
  const logoHeight =
    size === "sm"
      ? "h-6 sm:h-7"
      : size === "lg"
        ? "h-10 sm:h-12"
        : "h-[2.375rem] md:h-[2.875rem]";
  const titleClass =
    size === "sm"
      ? "font-brand text-sm leading-none lowercase tracking-wide text-white sm:text-base"
      : size === "lg"
        ? "font-brand text-[1.85rem] leading-none lowercase tracking-wide text-white sm:text-[2.35rem]"
        : "font-brand text-[1.65rem] leading-none lowercase tracking-wide text-white md:text-[2.1rem]";
  const subtitleClass =
    size === "sm"
      ? "text-[7px] font-medium uppercase leading-none tracking-[0.34em] text-white/40 sm:text-[8px]"
      : size === "lg"
        ? "text-[9px] font-medium uppercase leading-none tracking-[0.34em] text-white/45 sm:text-[10px]"
        : "text-[8px] font-medium uppercase leading-none tracking-[0.34em] text-white/40 md:text-[9px]";

  const content = (
    <span
      className={`inline-flex items-stretch gap-2 transition-opacity hover:opacity-70 sm:gap-2.5 ${className}`.trim()}
    >
      <span className={`flex shrink-0 items-center ${logoHeight}`}>
        {/* Plain img — Next/Image can break SVG class-based fills. */}
        <img
          src="/logo/logo-white.svg"
          alt=""
          width={260}
          height={58}
          aria-hidden
          className="h-full w-auto object-contain"
          decoding="async"
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center gap-1">
        <span className={titleClass}>bekography</span>
        <span className={subtitleClass}>Fotoğraf &amp; Film</span>
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} aria-label="bekography Ana Sayfa">
      {content}
    </Link>
  );
}
