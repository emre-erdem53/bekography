import type { PackageCategoryContent } from "@/lib/package-seed-data";

export type PackageOptionData = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
};

export type PackageCategoryData = {
  id: string;
  slug: string;
  title: string;
  accentColor: string;
  iconKey: string;
  highlight: boolean;
  backgroundImageUrl: string | null;
  heroImageUrl: string | null;
  content: PackageCategoryContent;
  options: PackageOptionData[];
};
