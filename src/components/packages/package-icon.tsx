import Image from "next/image";
import {
  BadgeCheck,
  Camera,
  CalendarDays,
  Compass,
  Diamond,
  Download,
  Gem,
  HandHeart,
  Handshake,
  HeartHandshake,
  Leaf,
  Mountain,
  Package,
  PartyPopper,
  Sparkles,
  Truck,
  UserRound,
  UserRoundCheck,
  Video,
} from "lucide-react";
import { packageMediaUrl } from "@/lib/package-media";

const iconMap = {
  Mountain,
  Gem,
  Sparkles,
  UserRound,
  Diamond,
  HandHeart,
  PartyPopper,
  HeartHandshake,
  Camera,
  Video,
  Compass,
  Download,
  Package,
  Leaf,
  Handshake,
  BadgeCheck,
  CalendarDays,
  Truck,
  UserRoundCheck,
} as const;

export function isCustomPackageIcon(iconKey: string) {
  return (
    iconKey.startsWith("http") ||
    iconKey.startsWith("/") ||
    iconKey.toLowerCase().endsWith(".svg")
  );
}

/** Yalnızca monokrom SVG ikonlar accent rengi ile boyanır; PNG/JPG kırpılmadan gösterilir. */
function shouldTintCustomIcon(iconKey: string) {
  return iconKey.toLowerCase().endsWith(".svg");
}

export function getPackageIcon(iconKey: string) {
  return iconMap[iconKey as keyof typeof iconMap] ?? Package;
}

type PackageIconDisplayProps = {
  iconKey: string;
  className?: string;
  style?: React.CSSProperties;
  imageSizes?: string;
};

function CustomPackageIcon({
  src,
  className,
  color,
  imageSizes,
}: {
  src: string;
  className: string;
  color?: string;
  imageSizes: string;
}) {
  if (color) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 ${className}`}
        style={{
          backgroundColor: color,
          maskImage: `url("${src}")`,
          WebkitMaskImage: `url("${src}")`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={24}
      height={24}
      className={
        /\bobject-/.test(className) ? className : `${className} object-contain`
      }
      sizes={imageSizes}
      unoptimized
    />
  );
}

export function PackageIconDisplay({
  iconKey,
  className = "h-5 w-5",
  style,
  imageSizes = "24px",
}: PackageIconDisplayProps) {
  if (isCustomPackageIcon(iconKey)) {
    const src = packageMediaUrl(iconKey) ?? iconKey;
    const color =
      shouldTintCustomIcon(iconKey) && typeof style?.color === "string"
        ? style.color
        : undefined;

    return (
      <CustomPackageIcon
        src={src}
        className={className}
        color={color}
        imageSizes={imageSizes}
      />
    );
  }

  const Icon = getPackageIcon(iconKey);
  return <Icon className={className} style={style} />;
}
