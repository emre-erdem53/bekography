import type { Metadata } from "next";
import { TrackingClient } from "@/components/tracking/tracking-client";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Rezervasyon Takibi",
  description: "Rezervasyon sürecinizi takip edin.",
  noIndex: true,
});

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TrackingClient slug={slug} />;
}
