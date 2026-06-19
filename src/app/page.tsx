import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { exploreMediaItems } from "@/lib/explore-media";

export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeExploreCarousel feedKey="home" items={exploreMediaItems} />
    </main>
  );
}
