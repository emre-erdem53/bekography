import { HomeCreator } from "@/components/home/home-creator";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSelectedVisuals } from "@/components/home/home-selected-visuals";
import { HomeSession } from "@/components/home/home-session";

export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHero />
      <HomeSelectedVisuals />
      <HomeCreator />
      <HomeSession />
    </main>
  );
}
