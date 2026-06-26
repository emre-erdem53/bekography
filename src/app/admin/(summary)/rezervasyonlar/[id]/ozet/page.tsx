import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReservationSummaryClient } from "@/components/admin/reservation-summary-client";
import { buildTrackingPayloadById } from "@/lib/build-tracking-payload";

export const metadata: Metadata = {
  title: "Müşteri Önizlemesi",
};

export default async function ReservationSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await buildTrackingPayloadById(id);

  if (!data) {
    notFound();
  }

  return <ReservationSummaryClient reservationId={id} data={data} />;
}
