import type { Metadata } from "next";
import { CampaignsPageContent } from "@/components/packages/campaigns-page-content";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Kampanyalar",
  description:
    "Bekography güncel paket kampanyaları. Ek paket indirimi ve kış kampanyası detayları.",
  path: "/kampanyalar",
});

export default function KampanyalarPage() {
  return <CampaignsPageContent />;
}
