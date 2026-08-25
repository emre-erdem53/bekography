"use client";

import { useState } from "react";
import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { PackagesHero } from "@/components/packages/packages-hero";
import type { ServiceAreaData } from "@/lib/package-types";
import type { ExploreMediaItem } from "@/lib/explore-media-types";

type HomePageClientProps = {
  exploreItems: ExploreMediaItem[];
  serviceAreas: ServiceAreaData[];
};

export function HomePageClient({
  exploreItems,
  serviceAreas,
}: HomePageClientProps) {
  const [exploreReady, setExploreReady] = useState(false);

  return (
    <>
      <div id="kesfet">
        <HomeExploreCarousel
          feedKey="home"
          items={exploreItems}
          onBootstrapComplete={() => setExploreReady(true)}
        />
      </div>
      <PackagesHero
        serviceAreas={serviceAreas}
        variant="section"
        visible={exploreReady}
      />
    </>
  );
}
