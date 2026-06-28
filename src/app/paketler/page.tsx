import type { Metadata } from "next";
import { PackagesHero } from "@/components/packages/packages-hero";
import {
  getActivePackages,
  serializePackageCategories,
} from "@/lib/packages";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Paketler",
  description:
    "Düğün fotoğraf & film paketleri. Dış çekim, düğün, nişan ve özel gün paketlerini inceleyin.",
  path: "/paketler",
});

export const dynamic = "force-dynamic";

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
