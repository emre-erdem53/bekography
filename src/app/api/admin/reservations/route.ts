import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { startOfDay } from "date-fns";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  addReservationStatusHistory,
  isShootDateTaken,
  getTrackingUrl,
} from "@/lib/reservations";
import {
  createReservationSchema,
  updateReservationStatusSchema,
  updateReservationSchema,
} from "@/lib/validations";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { shootDate: "desc" },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
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
    const shootDate = startOfDay(new Date(data.shootDate));

    if (await isShootDateTaken(shootDate)) {
      return NextResponse.json(
        {
          error: "Bu tarih için zaten bir rezervasyon bulunmaktadır.",
          code: "DATE_CONFLICT",
        },
        { status: 409 },
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        trackingSlug: nanoid(12),
        requestId: data.requestId ?? null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        city: data.city,
        shootDate,
        agreedPrice: data.agreedPrice,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            packageOptionId: item.packageOptionId,
            paymentType: item.paymentType,
            unitPrice: item.unitPrice,
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
