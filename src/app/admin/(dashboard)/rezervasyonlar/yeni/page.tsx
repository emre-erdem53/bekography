import { Suspense } from "react";
import { ReservationForm } from "@/components/admin/reservation-form";

export default function NewReservationPage() {
  return (
    <Suspense>
      <ReservationForm />
    </Suspense>
  );
}
