import { parseDateOnlyInput } from "@/lib/date-only";
import { prisma } from "@/lib/prisma";
import {
  applyStageTagsToDetailSections,
  type ItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import {
  buildProductSnapshotFromOption,
  emptyProductSnapshot,
  mergeProductSnapshot,
  parseProductSnapshot,
  type ReservationProductSnapshot,
} from "@/lib/reservation-product-snapshot";

export type ReservationItemInput = {
  packageOptionId: string;
  paymentType: "pesin" | "taksitli";
  unitPrice: number;
  shootDate: string;
  shootContent: string;
  readyTime?: string;
  location?: string;
  agreedUnitPrice: number;
  departureTime?: string | null;
  arrivalTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  itemKey?: string;
  workflowStageTags?: ItemWorkflowStageTags;
};

function withStageTags(
  snapshot: ReservationProductSnapshot,
  workflowStageTags?: ItemWorkflowStageTags,
): ReservationProductSnapshot {
  if (!workflowStageTags) return snapshot;
  return {
    ...snapshot,
    detailSections: applyStageTagsToDetailSections(
      snapshot.detailSections,
      workflowStageTags,
    ),
  };
}

function mapItemBase(
  reservationId: string,
  item: ReservationItemInput,
  productSnapshot: ReservationProductSnapshot,
) {
  return {
    reservationId,
    packageOptionId: item.packageOptionId,
    paymentType: item.paymentType,
    unitPrice: item.unitPrice,
    shootDate: parseDateOnlyInput(item.shootDate),
    shootContent: item.shootContent,
    readyTime: item.readyTime ?? "",
    location: item.location ?? "",
    agreedUnitPrice: item.agreedUnitPrice,
    departureTime: item.departureTime ?? null,
    arrivalTime: item.arrivalTime ?? null,
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    productSnapshot,
  };
}

export async function buildReservationItemCreates(
  reservationId: string,
  items: ReservationItemInput[],
  preservedSnapshots?: Map<string, unknown>,
) {
  const options = await prisma.packageOption.findMany({
    where: { id: { in: items.map((item) => item.packageOptionId) } },
    include: { category: true },
  });
  const optionMap = new Map(options.map((option) => [option.id, option]));

  return items.map((item) => {
    const option = optionMap.get(item.packageOptionId);
    const preserved = preservedSnapshots?.get(item.packageOptionId);
    const productSnapshot = withStageTags(
      preserved
        ? mergeProductSnapshot(
            parseProductSnapshot(preserved),
            option ? buildProductSnapshotFromOption(option) : emptyProductSnapshot(),
          )
        : option
          ? buildProductSnapshotFromOption(option)
          : emptyProductSnapshot(),
      item.workflowStageTags,
    );

    return mapItemBase(reservationId, item, productSnapshot);
  });
}

export function mapReservationItemCreatesForNewReservation(
  items: ReservationItemInput[],
  productSnapshots: Map<string, ReservationProductSnapshot>,
) {
  return items.map((item) => {
    const productSnapshot = withStageTags(
      resolveProductSnapshotForItem(item, productSnapshots),
      item.workflowStageTags,
    );

    return {
      packageOptionId: item.packageOptionId,
      paymentType: item.paymentType,
      unitPrice: item.unitPrice,
      shootDate: parseDateOnlyInput(item.shootDate),
      shootContent: item.shootContent,
      readyTime: item.readyTime ?? "",
      location: item.location ?? "",
      agreedUnitPrice: item.agreedUnitPrice,
      departureTime: item.departureTime ?? null,
      arrivalTime: item.arrivalTime ?? null,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      productSnapshot,
    };
  });
}

export async function loadProductSnapshotsForItems(
  items: ReservationItemInput[],
) {
  const options = await prisma.packageOption.findMany({
    where: { id: { in: items.map((item) => item.packageOptionId) } },
    include: { category: true },
  });

  const optionMap = new Map(options.map((option) => [option.id, option]));
  const snapshots = new Map<string, ReservationProductSnapshot>();

  for (const item of items) {
    const option = optionMap.get(item.packageOptionId);
    const snapshotKey = item.itemKey ?? item.packageOptionId;
    if (snapshots.has(snapshotKey)) continue;

    const base = option
      ? buildProductSnapshotFromOption(option)
      : emptyProductSnapshot();
    snapshots.set(snapshotKey, base);
  }

  return snapshots;
}

export function resolveProductSnapshotForItem(
  item: ReservationItemInput,
  snapshots: Map<string, ReservationProductSnapshot>,
): ReservationProductSnapshot {
  const snapshotKey = item.itemKey ?? item.packageOptionId;
  return (
    snapshots.get(snapshotKey) ??
    snapshots.get(item.packageOptionId) ??
    emptyProductSnapshot()
  );
}
