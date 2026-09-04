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
import {
  isOutdoorScheduleType,
  parsePostShootSnapshot,
  getItemWorkflowFlags,
  ensureItemWorkflows,
  reservationHasPrintingPackage,
} from "@/lib/post-shoot";
import type { ShootTypeContent } from "@/lib/package-seed-data";
import type { ScheduleType } from "@/lib/package-types";
import {
  packageHasPrintingStage,
  resolveWorkflowStages,
} from "@/lib/package-workflow-stages";
import {
  buildProductSnapshotFromShootType,
  getShootTypeLabel,
  parseProductSnapshot,
  resolveProductSnapshot,
  snapshotNeedsDetailEnrichment,
  type ShootTypeWithParents,
} from "@/lib/reservation-product-snapshot";
import type { TrackingData } from "@/lib/tracking-types";
import { buildTrackingWorkflowView } from "@/lib/tracking-workflow";
import {
  buildWorkflowStageTags,
  resolveDetailSectionsForStageTags,
} from "@/lib/tracking-stage-tags";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { isReservationTrackingAccessible } from "@/lib/tracking-access";

const reservationInclude = {
  items: {
    include: {
      shootType: {
        include: {
          package: {
            include: {
              serviceArea: true,
            },
          },
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

function resolveItemProductSnapshot(item: {
  productSnapshot: unknown;
  shootType: ShootTypeWithParents;
}) {
  return resolveProductSnapshot(
    parseProductSnapshot(item.productSnapshot),
    item.shootType,
    item.productSnapshot,
  );
}

function shootTypeContentOf(
  shootType: ShootTypeWithParents,
): Pick<{ content: ShootTypeContent }, "content"> {
  return { content: (shootType.content ?? {}) as ShootTypeContent };
}

function enrichPurchasedProductSnapshot(
  item: ReservationWithTracking["items"][number],
  snapshot: ReservationProductSnapshot,
): ReservationProductSnapshot {
  const serviceArea = item.shootType.package.serviceArea;
  const fresh = buildProductSnapshotFromShootType(item.shootType);

  return {
    ...snapshot,
    packageTitle: snapshot.packageTitle || fresh.packageTitle,
    // Kapsam metni canlı paket etiketlerinden gelsin; admin güncellemesi
    // müşteri önizlemesine hemen yansısın.
    packageTags:
      fresh.packageTags.length > 0 ? fresh.packageTags : snapshot.packageTags,
    highlightTags:
      snapshot.highlightTags.length > 0
        ? snapshot.highlightTags
        : fresh.highlightTags,
    detailSections: resolveDetailSectionsForStageTags({
      detailSections: snapshot.detailSections,
      serviceAreaSlug: snapshot.serviceAreaSlug || serviceArea.slug,
      serviceAreaTitle: snapshot.serviceAreaTitle || serviceArea.title,
      shootTypeLabel: snapshot.shootTypeLabelRaw || item.shootType.label,
      scheduleType: serviceArea.scheduleType as ScheduleType,
      shootType: shootTypeContentOf(item.shootType),
    }),
  };
}

async function persistLegacyProductSnapshots(
  items: {
    id: string;
    productSnapshot: unknown;
    shootType: ShootTypeWithParents;
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
  const reservationCreatedAt = reservation.createdAt;
  const paymentTypeLabel = reservation.items.some(
    (item) => item.paymentType === "taksitli",
  )
    ? paymentLabels.taksitli
    : paymentLabels.pesin;

  const workflow = buildTrackingWorkflowView({
    shootDate: earliestShoot,
    postShoot,
    workflow: workflowFlags,
    reservationCreatedAt,
    hasPrinting: reservationHasPrintingPackage(
      reservation.items.map((item) => ({
        hasPrinting: packageHasPrintingStage(
          resolveWorkflowStages(
            shootTypeContentOf(item.shootType),
            item.shootType.package.serviceArea.scheduleType as ScheduleType,
          ),
        ),
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
    createdAt: reservationCreatedAt.toISOString(),
    paymentTypeLabel,
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
      const pkg = item.shootType.package;
      const serviceArea = pkg.serviceArea;
      const scheduleType = serviceArea.scheduleType as ScheduleType;
      const outdoor = isOutdoorScheduleType(scheduleType);
      const snapshot = resolveItemProductSnapshot(item);
      const livePackageTags = pkg.tags ?? [];
      const productSnapshot = {
        ...snapshot,
        packageTitle: snapshot.packageTitle || pkg.title,
        packageTags:
          livePackageTags.length > 0
            ? livePackageTags
            : snapshot.packageTags,
        serviceAreaSlug: snapshot.serviceAreaSlug || serviceArea.slug,
        serviceAreaTitle: snapshot.serviceAreaTitle || serviceArea.title,
      };
      const shootTypeForContent = shootTypeContentOf(item.shootType);
      const stageDefinitions = resolveWorkflowStages(
        shootTypeForContent,
        scheduleType,
      );
      const hasPrinting = packageHasPrintingStage(stageDefinitions);
      const itemWorkflowFlags = getItemWorkflowFlags(postShoot, item.id);
      const itemWorkflow = buildTrackingWorkflowView({
        shootDate: item.shootDate,
        postShoot,
        workflow: itemWorkflowFlags,
        hasPrinting,
        stageDefinitions,
        reservationCreatedAt,
      });
      const workflowStageTags = buildWorkflowStageTags(
        postShoot,
        shootTypeForContent,
        item.id,
      );

      return {
        id: item.id,
        serviceAreaTitle: productSnapshot.serviceAreaTitle,
        packageTitle: productSnapshot.packageTitle,
        accentColor: snapshot.accentColor || serviceArea.accentColor,
        optionLabel: snapshot.shootTypeLabelRaw || item.shootType.label,
        shootTypeLabel:
          snapshot.shootTypeLabel || getShootTypeLabel(item.shootType.label),
        shootContent: item.shootContent,
        shootDate: item.shootDate.toISOString(),
        readyTime: item.readyTime,
        location: item.location,
        agreedUnitPrice: item.agreedUnitPrice,
        paymentType: paymentLabels[item.paymentType],
        isOutdoor: outdoor,
        hasPrinting,
        stageDefinitions,
        departureTime: item.departureTime,
        arrivalTime: item.arrivalTime,
        startTime: item.startTime,
        endTime: item.endTime,
        productSnapshot,
        workflow: itemWorkflow,
        workflowFlags: itemWorkflowFlags,
        workflowStageTags,
      };
    }),
    purchasedProducts: reservation.items.map((item) =>
      enrichPurchasedProductSnapshot(item, resolveItemProductSnapshot(item)),
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
