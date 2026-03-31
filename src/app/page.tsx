import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { HomeSelectedVisuals } from "@/components/home/home-selected-visuals";

export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeExploreCarousel />
      <HomeSelectedVisuals />
    </main>
  );
}
