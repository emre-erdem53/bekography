import { parseDateOnlyInput } from "@/lib/date-only";
import { prisma } from "@/lib/prisma";
import { type ItemWorkflowStageTags } from "@/lib/item-workflow-stage-tags";
import {
  buildProductSnapshotFromShootType,
  emptyProductSnapshot,
  mergeProductSnapshot,
  parseProductSnapshot,
  type ReservationProductSnapshot,
} from "@/lib/reservation-product-snapshot";

export type ReservationItemInput = {
  shootTypeId: string;
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

const shootTypeWithParents = {
  package: { include: { serviceArea: true } },
} as const;

async function loadShootTypeMap(items: ReservationItemInput[]) {
  const shootTypes = await prisma.shootType.findMany({
    where: { id: { in: items.map((item) => item.shootTypeId) } },
    include: shootTypeWithParents,
  });
  return new Map(shootTypes.map((shootType) => [shootType.id, shootType]));
}

function mapItemBase(
  reservationId: string,
  item: ReservationItemInput,
  productSnapshot: ReservationProductSnapshot,
) {
  return {
    reservationId,
    shootTypeId: item.shootTypeId,
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
  const shootTypeMap = await loadShootTypeMap(items);

  return items.map((item) => {
    const shootType = shootTypeMap.get(item.shootTypeId);
    const fresh = shootType
      ? buildProductSnapshotFromShootType(shootType)
      : emptyProductSnapshot();
    const preserved = preservedSnapshots?.get(item.shootTypeId);
    const productSnapshot = preserved
      ? mergeProductSnapshot(parseProductSnapshot(preserved), fresh)
      : fresh;

    return mapItemBase(reservationId, item, productSnapshot);
  });
}

export function mapReservationItemCreatesForNewReservation(
  items: ReservationItemInput[],
  productSnapshots: Map<string, ReservationProductSnapshot>,
) {
  return items.map((item) => ({
    shootTypeId: item.shootTypeId,
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
    productSnapshot: resolveProductSnapshotForItem(item, productSnapshots),
  }));
}

export async function loadProductSnapshotsForItems(
  items: ReservationItemInput[],
) {
  const shootTypeMap = await loadShootTypeMap(items);
  const snapshots = new Map<string, ReservationProductSnapshot>();

  for (const item of items) {
    const snapshotKey = item.itemKey ?? item.shootTypeId;
    if (snapshots.has(snapshotKey)) continue;

    const shootType = shootTypeMap.get(item.shootTypeId);
    snapshots.set(
      snapshotKey,
      shootType
        ? buildProductSnapshotFromShootType(shootType)
        : emptyProductSnapshot(),
    );
  }

  return snapshots;
}

export function resolveProductSnapshotForItem(
  item: ReservationItemInput,
  snapshots: Map<string, ReservationProductSnapshot>,
): ReservationProductSnapshot {
  const snapshotKey = item.itemKey ?? item.shootTypeId;
  return (
    snapshots.get(snapshotKey) ??
    snapshots.get(item.shootTypeId) ??
    emptyProductSnapshot()
  );
}
