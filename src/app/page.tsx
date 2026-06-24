import { HomePageClient } from "@/components/home/home-page-client";
import { AboutPageContent } from "@/components/about/about-page-content";
import { ContactPageClient } from "@/components/contact/contact-page-client";
import { exploreMediaItems } from "@/lib/explore-media";
import {
  getActivePackages,
  serializePackageCategories,
} from "@/lib/packages";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let categories: PackageCategoryData[] = [];

  try {
    const data = await getActivePackages();
    categories = serializePackageCategories(data).map((category) => ({
      ...category,
      content: category.content as PackageCategoryContent,
    }));
  } catch (error) {
    console.error("Failed to load packages for homepage:", error);
  }

  return (
    <main className="flex-1">
      <HomePageClient exploreItems={exploreMediaItems} categories={categories} />
      <AboutPageContent variant="section" />
      <ContactPageClient variant="section" />
    </main>
  );
}
