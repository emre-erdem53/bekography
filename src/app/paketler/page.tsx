import type { Metadata } from "next";
import { PackagesHero } from "@/components/packages/packages-hero";
import { getActivePackages, serializeServiceAreas } from "@/lib/packages";
import type { ServiceAreaData } from "@/lib/package-types";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Paketler",
  description:
    "Düğün fotoğraf & film paketleri. Dış çekim, düğün, nişan ve özel gün paketlerini inceleyin.",
  path: "/paketler",
});

export const dynamic = "force-dynamic";

export default async function PaketlerPage() {
  let serviceAreas: ServiceAreaData[] = [];

  try {
    serviceAreas = serializeServiceAreas(await getActivePackages());
  } catch (error) {
    console.error("Failed to load packages:", error);
  }

  return <PackagesHero serviceAreas={serviceAreas} />;
}
