import { ReservationDetailClient } from "@/components/admin/reservation-detail-client";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReservationDetailClient reservationId={id} />;
}
