import type {
  ServiceAreaContent,
  ShootTypeContent,
} from "@/lib/package-seed-data";
import { nestedPackageAccentTone } from "@/lib/color-utils";

export type ScheduleType = "indoor" | "outdoor";

export type ShootTypeData = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  iconKey: string | null;
  tags: string[];
  content: ShootTypeContent;
};

export type PackageData = {
  id: string;
  slug: string;
  title: string;
  accentColor: string | null;
  iconKey: string | null;
  tags: string[];
  shootTypes: ShootTypeData[];
};

/** Paket rengi yoksa hizmet alanı accent rengini kullanır. */
export function resolvePackageAccentColor(
  pkg: Pick<PackageData, "accentColor">,
  serviceArea: Pick<ServiceAreaData, "accentColor">,
) {
  return pkg.accentColor || serviceArea.accentColor;
}

/**
 * Vitrin iç paket listesi: hizmet alanı renginin açık→koyu tonları.
 */
export function resolveNestedPackageAccentColor(
  serviceArea: Pick<ServiceAreaData, "accentColor">,
  index: number,
  count: number,
) {
  return nestedPackageAccentTone(serviceArea.accentColor, index, count);
}

export type ServiceAreaData = {
  id: string;
  slug: string;
  title: string;
  accentColor: string;
  iconKey: string;
  highlight: boolean;
  backgroundImageUrl: string | null;
  heroImageUrl: string | null;
  scheduleType: ScheduleType;
  isCompanionOnly: boolean;
  tags: string[];
  content: ServiceAreaContent;
  packages: PackageData[];
};
