import type { Metadata } from "next";
import { HomeExploreCarousel } from "@/components/home/home-explore-carousel";
import { photoMediaItems } from "@/lib/explore-media";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Fotoğraflar",
  description:
    "Düğün fotoğrafları. Bekography'nin dış çekim, düğün ve özel gün fotoğraf çalışmalarından seçkiler.",
  path: "/fotograflar",
});

export default function FotograflarPage() {
  return (
    <main className="flex-1">
      <HomeExploreCarousel feedKey="fotograflar" items={photoMediaItems} />
    </main>
  );
}
