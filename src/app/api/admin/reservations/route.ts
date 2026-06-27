import { NextResponse } from "next/server";
import { ReservationStatus } from "@prisma/client";
import { nanoid } from "nanoid";
import { parseDateOnlyInput } from "@/lib/date-only";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  addReservationStatusHistory,
  findShootDateConflicts,
  getTrackingUrl,
} from "@/lib/reservations";
import { reservationNameFieldsFromInput } from "@/lib/reservation-utils";
import { createReservationSchema } from "@/lib/validations";
import {
  loadProductSnapshotsForItems,
  mapReservationItemCreatesForNewReservation,
} from "@/lib/reservation-item-snapshots";
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
};

async function loadReservationYearRows(): Promise<ReservationYearRow[]> {
  return prisma.$queryRaw<ReservationYearRow[]>`
    SELECT
      r.id,
      EXTRACT(YEAR FROM MIN(ri."shootDate"))::int AS year,
      r.status
    FROM "Reservation" r
    INNER JOIN "ReservationItem" ri ON ri."reservationId" = r.id
    WHERE r."deletedAt" IS NULL
    GROUP BY r.id, r.status
  `;
}

async function loadReservationIdsForYear(year: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT r.id
    FROM "Reservation" r
    INNER JOIN "ReservationItem" ri ON ri."reservationId" = r.id
    WHERE r."deletedAt" IS NULL
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
    const view = searchParams.get("view") ?? "active";
    const currentYear = getCurrentReservationYear();
    const selectedYear =
      parseReservationYearParam(searchParams.get("year")) ?? currentYear;

    const inactiveStatuses: ReservationStatus[] = ["iptal", "teslim_edildi"];

    if (view === "active") {
      const yearRows = await loadReservationYearRows();
      const yearOptions = buildYearOptions(yearRows, currentYear);
      const reservationIds = await loadReservationIdsForYear(selectedYear);

      const reservations = reservationIds.length
        ? await prisma.reservation.findMany({
            where: {
              id: { in: reservationIds },
              deletedAt: null,
              ...(selectedYear >= currentYear
                ? { status: { notIn: inactiveStatuses } }
                : {}),
            },
            orderBy: { createdAt: "desc" },
            include: reservationListInclude,
          })
        : [];

      return NextResponse.json({
        reservations,
        yearOptions,
        selectedYear,
      });
    }

    const where =
      view === "deleted"
        ? { deletedAt: { not: null } }
        : view === "past"
          ? { status: "teslim_edildi" as ReservationStatus, deletedAt: null }
          : {
              status: { notIn: inactiveStatuses },
              deletedAt: null,
            };

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy:
        view === "deleted"
          ? { deletedAt: "desc" }
          : { createdAt: "desc" },
      include: reservationListInclude,
    });

    return NextResponse.json({ reservations });
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
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
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
        cancellationFeeMax: data.cancellationFeeMax,
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

    return NextResponse.json({
      ...reservation,
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
