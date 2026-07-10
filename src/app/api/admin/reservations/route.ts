import { NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import { calculateCancellationFeeMax, getEarliestShootDateInput } from "@/lib/cancellation-fee";
import { parseDateOnlyInput } from "@/lib/date-only";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  addReservationStatusHistory,
  findShootDateConflicts,
  getTrackingUrl,
} from "@/lib/reservations";
import { reservationNameFieldsFromInput } from "@/lib/reservation-utils";
import { formatZodError } from "@/lib/validation-errors";
import { createReservationSchema } from "@/lib/validations";
import {
  loadProductSnapshotsForItems,
  mapReservationItemCreatesForNewReservation,
} from "@/lib/reservation-item-snapshots";
import { remapItemStageTagsByKeys } from "@/lib/item-workflow-stage-tags";
import {
  buildYearOptions,
  getCurrentReservationYear,
  parseReservationYearParam,
} from "@/lib/reservation-year";

const reservationListInclude = {
  items: {
    include: {
      packageOption: { include: { category: true } },
    },
    orderBy: { shootDate: "asc" as const },
  },
  installments: { orderBy: { sortOrder: "asc" as const } },
  request: true,
};

type ReservationYearRow = {
  id: string;
  year: number;
  status: ReservationStatus;
  deletedAt: Date | null;
};

async function loadReservationYearRows(): Promise<ReservationYearRow[]> {
  return prisma.$queryRaw<ReservationYearRow[]>`
    SELECT
      r.id,
      EXTRACT(YEAR FROM MIN(ri."shootDate"))::int AS year,
      r.status,
      r."deletedAt"
    FROM "Reservation" r
    INNER JOIN "ReservationItem" ri ON ri."reservationId" = r.id
    GROUP BY r.id, r.status, r."deletedAt"
  `;
}

async function loadReservationIdsForYear(year: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT r.id
    FROM "Reservation" r
    INNER JOIN "ReservationItem" ri ON ri."reservationId" = r.id
    GROUP BY r.id
    HAVING EXTRACT(YEAR FROM MIN(ri."shootDate")) = ${year}
  `;
  return rows.map((row) => row.id);
}

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const currentYear = getCurrentReservationYear();
    const selectedYear =
      parseReservationYearParam(searchParams.get("year")) ?? currentYear;
    const showDeleted = searchParams.get("view") === "silinenler";

    const yearRows = await loadReservationYearRows();
    const rowsForView = yearRows.filter((row) =>
      showDeleted ? row.deletedAt !== null : row.deletedAt === null,
    );
    const yearOptions = buildYearOptions(rowsForView, currentYear);
    const reservationIds = await loadReservationIdsForYear(selectedYear);

    const reservations = reservationIds.length
      ? await prisma.reservation.findMany({
          where: {
            id: { in: reservationIds },
            deletedAt: showDeleted ? { not: null } : null,
          },
          orderBy: showDeleted
            ? { deletedAt: "desc" }
            : { createdAt: "desc" },
          include: reservationListInclude,
        })
      : [];

    return NextResponse.json({
      reservations,
      yearOptions,
      selectedYear,
      view: showDeleted ? "silinenler" : "active",
    });
  } catch (error) {
    console.error("GET /api/admin/reservations", error);
    return NextResponse.json(
      { error: "Rezervasyonlar yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const conflicts = await findShootDateConflicts(
      data.items.map((item) => item.shootDate),
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Seçilen tarihlerden biri veya birkaçı için zaten rezervasyon bulunmaktadır.",
          code: "DATE_CONFLICT",
          conflicts,
        },
        { status: 409 },
      );
    }

    const productSnapshots = await loadProductSnapshotsForItems(data.items);
    const nameFields = reservationNameFieldsFromInput(data);
    const cancellationFeeMax = calculateCancellationFeeMax(
      data.totalPrice,
      getEarliestShootDateInput(data.items.map((item) => item.shootDate)),
    );

    const reservation = await prisma.reservation.create({
      data: {
        trackingSlug: nanoid(12),
        requestId: data.requestId ?? null,
        ...nameFields,
        brideTc: data.brideTc ?? "",
        bridePhone: data.bridePhone,
        groomTc: data.groomTc ?? "",
        groomPhone: data.groomPhone,
        totalPrice: data.totalPrice,
        cancellationFeeMax,
        discountAmount: data.discountAmount,
        discountEnabled: data.discountEnabled ?? false,
        postShoot: data.postShoot,
        notes: data.notes ?? null,
        items: {
          create: mapReservationItemCreatesForNewReservation(
            data.items,
            productSnapshots,
          ),
        },
        installments: {
          create: data.installments.map((installment, index) => ({
            amount: installment.amount,
            dueDate: parseDateOnlyInput(installment.dueDate),
            sortOrder: index,
          })),
        },
        statusHistory: {
          create: { status: "planlandi" },
        },
      },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
        installments: { orderBy: { sortOrder: "asc" } },
      },
    });

    const keyToId = new Map(
      data.items
        .map((item, index) => [
          item.itemKey ?? `${item.packageOptionId}:${index}`,
          reservation.items[index]?.id ?? "",
        ] as const)
        .filter(([, id]) => Boolean(id)),
    );
    const remappedTags = remapItemStageTagsByKeys(
      data.postShoot.itemStageTags,
      keyToId,
    );

    if (remappedTags) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          postShoot: {
            ...data.postShoot,
            itemStageTags: remappedTags,
          },
        },
      });
    }

    return NextResponse.json({
      ...reservation,
      postShoot: remappedTags
        ? { ...data.postShoot, itemStageTags: remappedTags }
        : reservation.postShoot,
      trackingUrl: getTrackingUrl(reservation.trackingSlug),
    });
  } catch (error) {
    console.error("POST /api/admin/reservations", error);
    return NextResponse.json(
      { error: "Rezervasyon oluşturulamadı" },
      { status: 500 },
    );
  }
}
