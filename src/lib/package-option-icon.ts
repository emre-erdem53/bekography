import type { PackageCategoryContent } from "@/lib/package-seed-data";

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

export function getOptionIconKey(
  option: { id: string; label: string },
  content?: PackageCategoryContent,
): string {
  const fromContent =
    content?.optionIconKeys?.[option.id] ??
    content?.optionIconKeys?.[option.label];

  if (fromContent) return fromContent;
  return inferOptionIconKey(option.label);
}
