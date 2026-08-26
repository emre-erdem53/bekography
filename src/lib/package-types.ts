import type {
  ServiceAreaContent,
  ShootTypeContent,
} from "@/lib/package-seed-data";

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
