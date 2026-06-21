import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { AboutPageContent } from "@/components/about/about-page-content";
import { ContactPageClient } from "@/components/contact/contact-page-client";
import { PackagesHero } from "@/components/packages/packages-hero";
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
      <div id="kesfet">
        <HomeExploreCarousel feedKey="home" items={exploreMediaItems} />
      </div>
      <PackagesHero categories={categories} variant="section" />
      <AboutPageContent variant="section" />
      <ContactPageClient variant="section" />
    </main>
  );
}
