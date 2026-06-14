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

export function getPackageIcon(iconKey: string) {
  return iconMap[iconKey as keyof typeof iconMap] ?? Package;
}
