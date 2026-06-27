import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
} from "@/lib/constants";
import { calculateCancellationFeeMax } from "@/lib/cancellation-fee";
import { toDateInputValue } from "@/lib/date-only";
import { getPaymentTypeLabels } from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings-store";
import { formatCoupleName } from "@/lib/reservation-utils";
import { isOutdoorCategory, itemHasPrintingStage, parsePostShootSnapshot, getItemWorkflowFlags, ensureItemWorkflows, reservationHasPrintingPackage } from "@/lib/post-shoot";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  buildProductSnapshotFromOption,
  getShootTypeLabel,
  parseProductSnapshot,
  resolveProductSnapshot,
  snapshotNeedsDetailEnrichment,
} from "@/lib/reservation-product-snapshot";
import type { TrackingData } from "@/lib/tracking-types";
import {
  buildTrackingWorkflowView,
} from "@/lib/tracking-workflow";
import { buildWorkflowStageTags } from "@/lib/tracking-stage-tags";
import { isReservationTrackingAccessible } from "@/lib/tracking-access";

const reservationInclude = {
  items: {
    include: {
      packageOption: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { shootDate: "asc" as const },
  },
  installments: { orderBy: { sortOrder: "asc" as const } },
  statusHistory: { orderBy: { changedAt: "asc" as const } },
} satisfies Prisma.ReservationInclude;

type ReservationWithTracking = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

function resolveItemProductSnapshot(
  item: {
    productSnapshot: unknown;
    packageOption: Parameters<typeof buildProductSnapshotFromOption>[0];
  },
) {
  return resolveProductSnapshot(
    parseProductSnapshot(item.productSnapshot),
    item.packageOption,
    item.productSnapshot,
  );
}

async function persistLegacyProductSnapshots(
  items: {
    id: string;
    productSnapshot: unknown;
    packageOption: Parameters<typeof buildProductSnapshotFromOption>[0];
  }[],
) {
  await Promise.all(
    items.map(async (item) => {
      if (!snapshotNeedsDetailEnrichment(item.productSnapshot)) return;

      const snapshot = resolveItemProductSnapshot(item);
      await prisma.reservationItem.update({
        where: { id: item.id },
        data: { productSnapshot: snapshot },
      });
    }),
  );
}

function buildPayloadFromReservation(
  reservation: ReservationWithTracking,
  paymentLabels: ReturnType<typeof getPaymentTypeLabels>,
): TrackingData {
  const completedStatuses = new Set(
    reservation.statusHistory.map((entry) => entry.status),
  );
  completedStatuses.add(reservation.status);

  const timeline = RESERVATION_STATUS_ORDER.filter((status) =>
    completedStatuses.has(status),
  ).map((status) => ({
    status,
    label: RESERVATION_STATUS_LABELS[status],
    isCurrent: status === reservation.status,
  }));

  const earliestShoot = reservation.items[0]?.shootDate ?? new Date();
  const postShoot = ensureItemWorkflows(
    parsePostShootSnapshot(reservation.postShoot),
    reservation.items.map((item) => item.id),
  );
  const workflowFlags = getItemWorkflowFlags(
    postShoot,
    reservation.items[0]?.id ?? "",
  );
  const workflow = buildTrackingWorkflowView({
    shootDate: earliestShoot,
    postShoot,
    workflow: workflowFlags,
    hasPrinting: reservationHasPrintingPackage(
      reservation.items.map((item) => ({
        categorySlug: item.packageOption.category.slug,
      })),
    ),
  });

  return {
    coupleName: formatCoupleName(
      reservation.brideName,
      reservation.groomName,
    ),
    brideName: reservation.brideName,
    groomName: reservation.groomName,
    bridePhone: reservation.bridePhone,
    groomPhone: reservation.groomPhone,
    brideTc: reservation.brideTc,
    groomTc: reservation.groomTc,
    formYear: new Date(earliestShoot).getFullYear(),
    city: reservation.items[0]?.location ?? "",
    shootDate: earliestShoot.toISOString(),
    status: reservation.status,
    statusLabel: RESERVATION_STATUS_LABELS[reservation.status],
    timeline,
    totalPrice: reservation.totalPrice,
    cancellationFeeMax: calculateCancellationFeeMax(
      reservation.totalPrice,
      reservation.items[0]?.shootDate
        ? toDateInputValue(reservation.items[0].shootDate)
        : null,
    ),
    discountAmount: reservation.discountAmount,
    discountEnabled: reservation.discountEnabled,
    postShoot,
    workflow,
    workflowFlags,
    installments: reservation.installments.map((row) => ({
      amount: row.amount,
      dueDate: row.dueDate.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
    })),
    items: reservation.items.map((item) => {
      const category = item.packageOption.category;
      const content =
        category.content && typeof category.content === "object"
          ? (category.content as Record<string, unknown>)
          : {};
      const outdoor = isOutdoorCategory(category.slug, content);
      const snapshot = resolveItemProductSnapshot(item);
      const hasPrinting = itemHasPrintingStage(category.slug);
      const itemWorkflowFlags = getItemWorkflowFlags(postShoot, item.id);
      const itemWorkflow = buildTrackingWorkflowView({
        shootDate: item.shootDate,
        postShoot,
        workflow: itemWorkflowFlags,
        hasPrinting,
      });
      const categoryContent =
        category.content && typeof category.content === "object"
          ? (category.content as PackageCategoryContent)
          : undefined;
      const workflowStageTags = buildWorkflowStageTags(
        snapshot.detailSections ?? [],
        postShoot,
        {
          categorySlug: snapshot.categorySlug || category.slug,
          categoryTitle: snapshot.categoryTitle || category.title,
          optionLabel: snapshot.optionLabel || item.packageOption.label,
          packageOptionId: snapshot.packageOptionId || item.packageOption.id,
          categoryContent,
        },
      );

      return {
        id: item.id,
        categoryTitle: snapshot.categoryTitle || category.title,
        accentColor: snapshot.accentColor || category.accentColor,
        optionLabel: snapshot.optionLabel || item.packageOption.label,
        shootTypeLabel:
          snapshot.shootTypeLabel ||
          getShootTypeLabel(item.packageOption.label),
        shootContent: item.shootContent,
        shootDate: item.shootDate.toISOString(),
        readyTime: item.readyTime,
        location: item.location,
        agreedUnitPrice: item.agreedUnitPrice,
        paymentType: paymentLabels[item.paymentType],
        isOutdoor: outdoor,
        hasPrinting,
        departureTime: item.departureTime,
        arrivalTime: item.arrivalTime,
        startTime: item.startTime,
        endTime: item.endTime,
        productSnapshot: snapshot,
        workflow: itemWorkflow,
        workflowFlags: itemWorkflowFlags,
        workflowStageTags,
      };
    }),
    purchasedProducts: reservation.items.map((item) =>
      resolveItemProductSnapshot(item),
    ),
  };
}

export async function buildTrackingPayloadBySlug(
  slug: string,
): Promise<TrackingData | null> {
  const [reservation, siteSettings] = await Promise.all([
    prisma.reservation.findUnique({
      where: { trackingSlug: slug },
      include: reservationInclude,
    }),
    getSiteSettings(),
  ]);

  if (!reservation || reservation.status === "iptal" || reservation.deletedAt) {
    return null;
  }

  if (!isReservationTrackingAccessible(reservation)) {
    return null;
  }

  await persistLegacyProductSnapshots(reservation.items);

  return buildPayloadFromReservation(
    reservation,
    getPaymentTypeLabels(siteSettings),
  );
}

export async function buildTrackingPayloadById(
  id: string,
): Promise<TrackingData | null> {
  const [reservation, siteSettings] = await Promise.all([
    prisma.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    }),
    getSiteSettings(),
  ]);

  if (!reservation || reservation.status === "iptal" || reservation.deletedAt) {
    return null;
  }

  if (!isReservationTrackingAccessible(reservation)) {
    return null;
  }

  await persistLegacyProductSnapshots(reservation.items);

  return buildPayloadFromReservation(
    reservation,
    getPaymentTypeLabels(siteSettings),
  );
}
