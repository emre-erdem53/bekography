import type { Metadata } from "next";
import { PackagesCartClient } from "@/components/packages/packages-cart-client";
import {
  getActivePackages,
  serializePackageCategories,
} from "@/lib/packages";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sepetim",
  description:
    "Seçtiğiniz düğün fotoğraf & film paketleri. Talep oluşturun.",
  path: "/paketler/sepet",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function PaketlerSepetPage() {
  let categories: PackageCategoryData[] = [];

  try {
    const data = await getActivePackages();
    categories = serializePackageCategories(data).map((category) => ({
      ...category,
      content: category.content as PackageCategoryContent,
    }));
  } catch (error) {
    console.error("Failed to load packages for cart:", error);
  }

  return <PackagesCartClient categories={categories} />;
}
