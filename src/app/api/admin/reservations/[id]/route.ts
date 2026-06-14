import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  addReservationStatusHistory,
  findShootDateConflicts,
  getTrackingUrl,
} from "@/lib/reservations";
import {
  updateReservationSchema,
  updateReservationStatusSchema,
} from "@/lib/validations";

function mapItemCreate(
  reservationId: string,
  item: {
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
  },
) {
  return {
    reservationId,
    packageOptionId: item.packageOptionId,
    paymentType: item.paymentType,
    unitPrice: item.unitPrice,
    shootDate: startOfDay(new Date(item.shootDate)),
    shootContent: item.shootContent,
    readyTime: item.readyTime ?? "",
    location: item.location ?? "",
    agreedUnitPrice: item.agreedUnitPrice,
    departureTime: item.departureTime ?? null,
    arrivalTime: item.arrivalTime ?? null,
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
  };
}

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
          orderBy: { shootDate: "asc" },
        },
        installments: { orderBy: { sortOrder: "asc" } },
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

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    if (data.items) {
      const conflicts = await findShootDateConflicts(
        data.items.map((item) => item.shootDate),
        id,
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
    }

    await prisma.reservation.update({
      where: { id },
      data: {
        brideName: data.brideName,
        brideTc: data.brideTc,
        bridePhone: data.bridePhone,
        groomName: data.groomName,
        groomTc: data.groomTc,
        groomPhone: data.groomPhone,
        totalPrice: data.totalPrice,
        cancellationFeeMax: data.cancellationFeeMax,
        discountAmount: data.discountAmount,
        postShoot: data.postShoot,
        notes: data.notes !== undefined ? data.notes : undefined,
        status: data.status,
      },
    });

    if (data.status && existing.status !== data.status) {
      await addReservationStatusHistory(id, data.status);
    }

    if (data.items) {
      await prisma.reservationItem.deleteMany({ where: { reservationId: id } });
      await prisma.reservationItem.createMany({
        data: data.items.map((item) => mapItemCreate(id, item)),
      });
    }

    if (data.installments) {
      await prisma.reservationPaymentInstallment.deleteMany({
        where: { reservationId: id },
      });
      await prisma.reservationPaymentInstallment.createMany({
        data: data.installments.map((installment, index) => ({
          reservationId: id,
          amount: installment.amount,
          dueDate: startOfDay(new Date(installment.dueDate)),
          sortOrder: index,
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
          orderBy: { shootDate: "asc" },
        },
        installments: { orderBy: { sortOrder: "asc" } },
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    await prisma.reservation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/reservations/[id]", error);
    return NextResponse.json(
      { error: "Rezervasyon silinemedi" },
      { status: 500 },
    );
  }
}
