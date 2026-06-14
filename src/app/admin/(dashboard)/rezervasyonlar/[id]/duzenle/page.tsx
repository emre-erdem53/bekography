import { Suspense } from "react";
import { ReservationForm } from "@/components/admin/reservation-form";

export default async function EditReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense>
      <ReservationForm reservationId={id} />
    </Suspense>
  );
}
