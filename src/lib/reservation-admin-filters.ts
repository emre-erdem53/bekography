import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";
import { ADMIN_WORKFLOW_STAGE_OPTIONS } from "@/lib/tracking-workflow";
import { reservationMatchesWorkflowStage } from "@/lib/reservation-list";

type ReservationListRow = {
  brideName: string;
  groomName: string;
  postShoot: unknown;
  items: Array<{
    id: string;
    shootDate: string | Date;
    location: string;
    productSnapshot: unknown;
    packageOption: { label: string; category: { title: string } };
  }>;
};

/** Aktif rezervasyon listesinde filtre kutucuklarında gösterilen aşamalar. */
export const RESERVATION_ADMIN_FILTER_STAGES: TrackingWorkflowStageId[] =
  ADMIN_WORKFLOW_STAGE_OPTIONS.map((option) => option.id);

export const RESERVATION_ADMIN_STAGE_LABELS: Record<
  TrackingWorkflowStageId,
  string
> = Object.fromEntries(
  ADMIN_WORKFLOW_STAGE_OPTIONS.map((option) => [option.id, option.label]),
) as Record<TrackingWorkflowStageId, string>;

type ReservationNameFields = {
  brideName: string;
  brideFirstName?: string;
  groomName: string;
  groomFirstName?: string;
};

export function matchesReservationNameQuery(
  reservation: ReservationNameFields,
  query: string,
): boolean {
  const normalized = query.trim().toLocaleLowerCase("tr");
  if (!normalized) return true;
  const haystack = [
    reservation.brideName,
    reservation.brideFirstName,
    reservation.groomName,
    reservation.groomFirstName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr");
  return haystack.includes(normalized);
}

export function countReservationsByWorkflowStage<T extends ReservationListRow>(
  reservations: T[],
): Record<TrackingWorkflowStageId, number> {
  const counts = Object.fromEntries(
    RESERVATION_ADMIN_FILTER_STAGES.map((stage) => [stage, 0]),
  ) as Record<TrackingWorkflowStageId, number>;

  for (const reservation of reservations) {
    for (const stage of RESERVATION_ADMIN_FILTER_STAGES) {
      if (reservationMatchesWorkflowStage(reservation, stage)) {
        counts[stage] += 1;
      }
    }
  }

  return counts;
}
