"use client";

import { useState } from "react";
import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { AboutPageContent } from "@/components/about/about-page-content";
import { ContactPageClient } from "@/components/contact/contact-page-client";
import { PackagesHero } from "@/components/packages/packages-hero";
import type { PackageCategoryData } from "@/lib/package-types";
import type { ExploreMediaItem } from "@/lib/explore-media-types";

type HomePageClientProps = {
  exploreItems: ExploreMediaItem[];
  categories: PackageCategoryData[];
};

export function HomePageClient({
  exploreItems,
  categories,
}: HomePageClientProps) {
  const [exploreReady, setExploreReady] = useState(false);

  return (
    <main className="flex-1">
      <div id="kesfet">
        <HomeExploreCarousel
          feedKey="home"
          items={exploreItems}
          onBootstrapComplete={() => setExploreReady(true)}
        />
      </div>
      <PackagesHero
        categories={categories}
        variant="section"
        visible={exploreReady}
      />
      <AboutPageContent variant="section" />
      <ContactPageClient variant="section" />
    </main>
  );
}
