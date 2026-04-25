import type { Metadata } from "next";
import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { photoMediaItems } from "@/lib/explore-media";

export const metadata: Metadata = {
  title: "Fotoğraflar",
  description: "bekography fotoğraflar akışı.",
};

export default function FotograflarPage() {
  return <HomeExploreCarousel items={photoMediaItems} />;
}
