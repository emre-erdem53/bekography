import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  addReservationStatusHistory,
  isShootDateTaken,
  getTrackingUrl,
} from "@/lib/reservations";
import {
  updateReservationSchema,
  updateReservationStatusSchema,
} from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
        request: {
          include: {
            items: {
              include: {
                packageOption: { include: { category: true } },
              },
            },
          },
        },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...reservation,
      trackingUrl: getTrackingUrl(reservation.trackingSlug),
    });
  } catch (error) {
    console.error("GET /api/admin/reservations/[id]", error);
    return NextResponse.json(
      { error: "Rezervasyon yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status && Object.keys(body).length === 1) {
      const parsed = updateReservationStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
      }

      const existing = await prisma.reservation.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { error: "Rezervasyon bulunamadı" },
          { status: 404 },
        );
      }

      if (existing.status !== parsed.data.status) {
        await addReservationStatusHistory(id, parsed.data.status);
      }

      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      return NextResponse.json(updated);
    }

    const parsed = updateReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.shootDate) {
      const shootDate = startOfDay(new Date(data.shootDate));
      if (await isShootDateTaken(shootDate, id)) {
        return NextResponse.json(
          {
            error: "Bu tarih için zaten bir rezervasyon bulunmaktadır.",
            code: "DATE_CONFLICT",
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        city: data.city,
        shootDate: data.shootDate
          ? startOfDay(new Date(data.shootDate))
          : undefined,
        agreedPrice: data.agreedPrice,
        notes: data.notes,
        status: data.status,
      },
    });

    if (data.status) {
      await addReservationStatusHistory(id, data.status);
    }

    if (data.items) {
      await prisma.reservationItem.deleteMany({ where: { reservationId: id } });
      await prisma.reservationItem.createMany({
        data: data.items.map((item) => ({
          reservationId: id,
          packageOptionId: item.packageOptionId,
          paymentType: item.paymentType,
          unitPrice: item.unitPrice,
        })),
      });
    }

    const full = await prisma.reservation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
      },
    });

    return NextResponse.json(full);
  } catch (error) {
    console.error("PATCH /api/admin/reservations/[id]", error);
    return NextResponse.json(
      { error: "Rezervasyon güncellenemedi" },
      { status: 500 },
    );
  }
}
