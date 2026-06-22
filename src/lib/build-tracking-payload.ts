import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
} from "@/lib/constants";
import { getPaymentTypeLabels } from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings-store";
import { formatCoupleName } from "@/lib/reservation-utils";
import { isOutdoorCategory, parsePostShootSnapshot } from "@/lib/post-shoot";
import type { TrackingData } from "@/lib/tracking-types";

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
  const postShoot = parsePostShootSnapshot(reservation.postShoot);

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
    cancellationFeeMax: reservation.cancellationFeeMax,
    discountAmount: reservation.discountAmount,
    postShoot,
    installments: reservation.installments.map((row) => ({
      amount: row.amount,
      dueDate: row.dueDate.toISOString(),
    })),
    items: reservation.items.map((item) => {
      const category = item.packageOption.category;
      const content =
        category.content && typeof category.content === "object"
          ? (category.content as Record<string, unknown>)
          : {};
      const outdoor = isOutdoorCategory(category.slug, content);

      return {
        categoryTitle: category.title,
        accentColor: category.accentColor,
        optionLabel: item.packageOption.label,
        shootContent: item.shootContent,
        shootDate: item.shootDate.toISOString(),
        readyTime: item.readyTime,
        location: item.location,
        agreedUnitPrice: item.agreedUnitPrice,
        paymentType: paymentLabels[item.paymentType],
        isOutdoor: outdoor,
        departureTime: item.departureTime,
        arrivalTime: item.arrivalTime,
        startTime: item.startTime,
        endTime: item.endTime,
      };
    }),
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

  if (!reservation || reservation.status === "iptal") {
    return null;
  }

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

  if (!reservation || reservation.status === "iptal") {
    return null;
  }

  return buildPayloadFromReservation(
    reservation,
    getPaymentTypeLabels(siteSettings),
  );
}
