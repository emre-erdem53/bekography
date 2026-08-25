import type { ShootTypeData } from "@/lib/package-types";

export const PACKAGE_OPTION_ICON_KEYS = [
  "Camera",
  "Video",
  "Mountain",
  "Package",
  "Gem",
  "Sparkles",
  "UserRound",
  "Diamond",
  "HandHeart",
  "PartyPopper",
  "HeartHandshake",
] as const;

export type PackageOptionIconKey = (typeof PACKAGE_OPTION_ICON_KEYS)[number];

/** Hizmet alanı "neler dahil" kartlarında kullanılabilecek ikonlar. */
export const PACKAGE_SERVICE_ICON_KEYS = [
  "Camera",
  "Video",
  "Compass",
  "Download",
  "Package",
  "Gem",
  "Sparkles",
  "Leaf",
  "Handshake",
  "BadgeCheck",
  "CalendarDays",
  "Truck",
  "UserRoundCheck",
] as const;

export function inferOptionIconKey(label: string): PackageOptionIconKey {
  const lower = label.toLowerCase();

  if (
    (lower.includes("fotoğraf") || lower.includes("fotograf")) &&
    (lower.includes("video") || lower.includes("film"))
  ) {
    return "Video";
  }
  if (lower.includes("video") || lower.includes("film")) return "Video";
  if (lower.includes("fotoğraf") || lower.includes("fotograf")) return "Camera";

  return "Package";
}

export function getShootTypeIconKey(
  shootType: Pick<ShootTypeData, "label" | "iconKey">,
): string {
  return shootType.iconKey || inferOptionIconKey(shootType.label);
}
