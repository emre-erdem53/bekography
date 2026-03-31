import type { Metadata } from "next";
import { PackagesHero } from "@/components/packages/packages-hero";

export const metadata: Metadata = {
  title: "Paketler",
  description: "Paket detayları ve hizmet farkları.",
};

export default function PaketlerPage() {
  return <PackagesHero />;
}
