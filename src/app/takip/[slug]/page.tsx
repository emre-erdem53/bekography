import type { Metadata } from "next";
import { TrackingClient } from "@/components/tracking/tracking-client";

export const metadata: Metadata = {
  title: "Rezervasyon Takibi",
  description: "Rezervasyon sürecinizi takip edin.",
};

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TrackingClient slug={slug} />;
}
