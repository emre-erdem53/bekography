import type { Metadata } from "next";
import { PackagesCartClient } from "@/components/packages/packages-cart-client";
import { getActivePackages, serializeServiceAreas } from "@/lib/packages";
import type { ServiceAreaData } from "@/lib/package-types";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sepetim",
  description:
    "Seçtiğiniz düğün fotoğraf & film paketleri. Talep oluşturun.",
  path: "/paketler/sepet",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function PaketlerSepetPage() {
  let serviceAreas: ServiceAreaData[] = [];

  try {
    serviceAreas = serializeServiceAreas(await getActivePackages());
  } catch (error) {
    console.error("Failed to load packages for cart:", error);
  }

  return <PackagesCartClient serviceAreas={serviceAreas} />;
}
