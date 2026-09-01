import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackagesHero } from "@/components/packages/packages-hero";
import {
  getActiveServiceAreaBySlug,
  serializeServiceArea,
} from "@/lib/packages";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const serviceArea = await getActiveServiceAreaBySlug(slug);
    if (serviceArea) {
      return createPageMetadata({
        title: serviceArea.title,
        description: `${serviceArea.title} paketleri ve çekim türleri. Fiyatları inceleyin, sepete ekleyin.`,
        path: `/paketler/${serviceArea.slug}`,
      });
    }
  } catch (error) {
    console.error("Failed to build service area metadata:", error);
  }

  return createPageMetadata({
    title: "Paketler",
    description: "Düğün fotoğraf & film paketleri.",
    path: "/paketler",
  });
}

export default async function ServiceAreaPackagesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getActiveServiceAreaBySlug(slug);

  if (!row) notFound();

  return <PackagesHero serviceArea={serializeServiceArea(row)} />;
}
