import { parsePostShootSnapshot } from "@/lib/post-shoot";
import {
  getShootTypeLabel,
  parseProductSnapshot,
} from "@/lib/reservation-product-snapshot";
import {
  buildTrackingWorkflowView,
  emptyTrackingWorkflowFlags,
} from "@/lib/tracking-workflow";
import { formatDateOnlyDisplay, toDateInputValue } from "@/lib/date-only";

type ReservationListItem = {
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
  const sortedItems = [...reservation.items].sort(
    (a, b) => new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime(),
  );
  const earliestShoot = sortedItems[0]?.shootDate ?? new Date();
  const postShoot = parsePostShootSnapshot(reservation.postShoot);
  const workflow = buildTrackingWorkflowView({
    shootDate: new Date(earliestShoot),
    postShoot,
    workflow: postShoot.workflow ?? emptyTrackingWorkflowFlags(),
  });
  return workflow.primaryTitle;
}

export { toDateInputValue };
