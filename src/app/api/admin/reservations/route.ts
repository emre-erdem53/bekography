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
import { createReservationSchema } from "@/lib/validations";
import {
  loadProductSnapshotsForItems,
  mapReservationItemCreatesForNewReservation,
} from "@/lib/reservation-item-snapshots";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") ?? "active";

    const inactiveStatuses: ReservationStatus[] = ["iptal", "teslim_edildi"];

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
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
          orderBy: { shootDate: "asc" },
        },
        installments: { orderBy: { sortOrder: "asc" } },
        request: true,
      },
    });

    return NextResponse.json(reservations);
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

    const reservation = await prisma.reservation.create({
      data: {
        trackingSlug: nanoid(12),
        requestId: data.requestId ?? null,
        brideName: data.brideName,
        brideTc: data.brideTc ?? "",
        bridePhone: data.bridePhone,
        groomName: data.groomName,
        groomTc: data.groomTc ?? "",
        groomPhone: data.groomPhone,
        totalPrice: data.totalPrice,
        cancellationFeeMax: data.cancellationFeeMax,
        discountAmount: data.discountAmount,
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
