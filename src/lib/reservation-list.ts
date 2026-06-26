import {
  ensureItemWorkflows,
  getItemWorkflowFlags,
  parsePostShootSnapshot,
} from "@/lib/post-shoot";
import {
  getShootTypeLabel,
  parseProductSnapshot,
} from "@/lib/reservation-product-snapshot";
import {
  buildTrackingWorkflowView,
  getCurrentWorkflowStageId,
  type TrackingWorkflowStageId,
} from "@/lib/tracking-workflow";
import { formatDateOnlyDisplay, toDateInputValue } from "@/lib/date-only";

type ReservationListItem = {
  id: string;
  shootDate: string | Date;
  location: string;
  productSnapshot: unknown;
  packageOption: {
    label: string;
    category: { title: string };
  };
};

type ReservationListRow = {
  brideName: string;
  groomName: string;
  postShoot: unknown;
  items: ReservationListItem[];
};

function buildItemWorkflowView(
  reservation: ReservationListRow,
  item: ReservationListItem,
) {
  const postShoot = ensureItemWorkflows(
    parsePostShootSnapshot(reservation.postShoot),
    reservation.items.map((row) => row.id),
  );

  return buildTrackingWorkflowView({
    shootDate: new Date(item.shootDate),
    postShoot,
    workflow: getItemWorkflowFlags(postShoot, item.id),
  });
}

export function formatReservationListShootDate(items: ReservationListItem[]) {
  if (items.length === 0) return "—";
  const dates = [...items]
    .map((item) => item.shootDate)
    .sort(
      (a, b) =>
        new Date(a).getTime() - new Date(b).getTime(),
    );

  if (dates.length === 1) {
    return formatDateOnlyDisplay(dates[0]);
  }

  const first = formatDateOnlyDisplay(dates[0], "d MMM");
  const last = formatDateOnlyDisplay(dates[dates.length - 1]);
  return `${first} — ${last}`;
}

export function formatReservationListPackages(items: ReservationListItem[]) {
  if (items.length === 0) return "—";

  return items
    .map((item) => {
      const snapshot = parseProductSnapshot(item.productSnapshot);
      const title =
        snapshot.categoryTitle || item.packageOption.category.title;
      const type =
        snapshot.shootTypeLabel ||
        getShootTypeLabel(item.packageOption.label);
      return `${title} · ${type}`;
    })
    .join(", ");
}

export function formatReservationListLocation(items: ReservationListItem[]) {
  const locations = [
    ...new Set(items.map((item) => item.location.trim()).filter(Boolean)),
  ];
  if (locations.length === 0) return "—";
  return locations.join(", ");
}

export function getReservationWorkflowStageLabel(
  reservation: ReservationListRow,
): string {
  if (reservation.items.length === 0) return "—";

  return reservation.items
    .map((item) => {
      const snapshot = parseProductSnapshot(item.productSnapshot);
      const title =
        snapshot.categoryTitle || item.packageOption.category.title;
      const workflow = buildItemWorkflowView(reservation, item);
      return `${title}: ${workflow.primaryTitle}`;
    })
    .join(" · ");
}

export function getReservationItemWorkflowStage(
  reservation: ReservationListRow,
  item: ReservationListItem,
): TrackingWorkflowStageId | null {
  const workflow = buildItemWorkflowView(reservation, item);
  return getCurrentWorkflowStageId(workflow);
}

export function reservationMatchesWorkflowStage(
  reservation: ReservationListRow,
  stage: TrackingWorkflowStageId,
): boolean {
  return reservation.items.some(
    (item) => getReservationItemWorkflowStage(reservation, item) === stage,
  );
}

export { toDateInputValue };
