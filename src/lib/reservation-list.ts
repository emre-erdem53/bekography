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

export type ReservationListItem = {
  id: string;
  shootDate: string | Date;
  location: string;
  productSnapshot: unknown;
  shootType: {
    label: string;
    package: {
      title: string;
      serviceArea: { title: string; accentColor?: string };
    };
  };
};

export type ReservationListColoredSegment = {
  text: string;
  color: string;
};

export type ReservationListRow = {
  brideName: string;
  groomName: string;
  postShoot: unknown;
  items: ReservationListItem[];
};

function getItemAccentColor(item: ReservationListItem): string {
  const snapshot = parseProductSnapshot(item.productSnapshot);
  return (
    snapshot.accentColor ||
    item.shootType.package.serviceArea.accentColor ||
    "#ffffff"
  );
}

/** `{hizmet alanı} · {paket} · {çekim türü}` — v2 snapshot'larda paket adı canlı veriden gelir. */
function formatItemPath(item: ReservationListItem): string {
  const snapshot = parseProductSnapshot(item.productSnapshot);
  const serviceAreaTitle =
    snapshot.serviceAreaTitle || item.shootType.package.serviceArea.title;
  const packageTitle = snapshot.packageTitle || item.shootType.package.title;
  const shootTypeLabel =
    snapshot.shootTypeLabel || getShootTypeLabel(item.shootType.label);

  return [serviceAreaTitle, packageTitle, shootTypeLabel]
    .filter(Boolean)
    .join(" · ");
}

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

export function getReservationListPackageSegments(
  items: ReservationListItem[],
): ReservationListColoredSegment[] {
  if (items.length === 0) return [];

  return items.map((item) => ({
    text: formatItemPath(item),
    color: getItemAccentColor(item),
  }));
}

export function getReservationListStageSegments(
  reservation: ReservationListRow,
): ReservationListColoredSegment[] {
  if (reservation.items.length === 0) return [];

  return reservation.items.map((item) => {
    const snapshot = parseProductSnapshot(item.productSnapshot);
    const title =
      snapshot.serviceAreaTitle || item.shootType.package.serviceArea.title;
    const workflow = buildItemWorkflowView(reservation, item);
    return {
      text: `${title}: ${workflow.primaryTitle}`,
      color: getItemAccentColor(item),
    };
  });
}

export function formatReservationListPackages(items: ReservationListItem[]) {
  const segments = getReservationListPackageSegments(items);
  if (segments.length === 0) return "—";
  return segments.map((segment) => segment.text).join(", ");
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
  const segments = getReservationListStageSegments(reservation);
  if (segments.length === 0) return "—";
  return segments.map((segment) => segment.text).join(" · ");
}

export function getReservationItemWorkflowStage(
  reservation: ReservationListRow,
  item: ReservationListItem,
): string | null {
  const workflow = buildItemWorkflowView(reservation, item);
  return getCurrentWorkflowStageId(workflow);
}

export function reservationMatchesWorkflowStage(
  reservation: ReservationListRow,
  stage: string,
): boolean {
  return reservation.items.some(
    (item) => getReservationItemWorkflowStage(reservation, item) === stage,
  );
}

export { toDateInputValue };
