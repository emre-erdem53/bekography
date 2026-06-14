import type { Metadata } from "next";
import { PackagesHero } from "@/components/packages/packages-hero";
import {
  getActivePackages,
  serializePackageCategories,
} from "@/lib/packages";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

export const metadata: Metadata = {
  title: "Paketler",
  description: "Paket detayları ve hizmet farkları.",
};

export default async function PaketlerPage() {
  let categories: PackageCategoryData[] = [];

  try {
    const data = await getActivePackages();
    categories = serializePackageCategories(data).map((category) => ({
      ...category,
      content: category.content as PackageCategoryContent,
    }));
  } catch (error) {
    console.error("Failed to load packages:", error);
  }

  return <PackagesHero categories={categories} />;
}
