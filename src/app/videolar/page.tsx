import type { Metadata } from "next";
import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { videoMediaItems } from "@/lib/explore-media";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Videolar",
  description:
    "Düğün filmleri ve sinematik video çekimleri. Bekography düğün ve dış çekim film seçkisi.",
  path: "/videolar",
});

export default function VideolarPage() {
  return (
    <main className="flex-1">
      <HomeExploreCarousel feedKey="videolar" items={videoMediaItems} />
    </main>
  );
}
