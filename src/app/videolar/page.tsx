import type { Metadata } from "next";
import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { videoMediaItems } from "@/lib/explore-media";

export const metadata: Metadata = {
  title: "Videolar",
  description: "bekography video akışı.",
};

export default function VideolarPage() {
  return <HomeExploreCarousel items={videoMediaItems} landscapeVideoSpan={3} />;
}
