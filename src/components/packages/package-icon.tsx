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

export function getPackageIcon(iconKey: string) {
  return iconMap[iconKey as keyof typeof iconMap] ?? Package;
}

type PackageIconDisplayProps = {
  iconKey: string;
  className?: string;
  style?: React.CSSProperties;
  imageSizes?: string;
};

export function PackageIconDisplay({
  iconKey,
  className = "h-5 w-5",
  style,
  imageSizes = "24px",
}: PackageIconDisplayProps) {
  if (isCustomPackageIcon(iconKey)) {
    const src = packageMediaUrl(iconKey) ?? iconKey;
    return (
      <Image
        src={src}
        alt=""
        width={24}
        height={24}
        className={`${className} object-contain`}
        style={style}
        sizes={imageSizes}
        unoptimized
      />
    );
  }

  const Icon = getPackageIcon(iconKey);
  return <Icon className={className} style={style} />;
}
