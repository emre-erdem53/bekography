import { NextResponse } from "next/server";
import { parseDateOnlyInput } from "@/lib/date-only";
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
import { buildReservationItemCreates } from "@/lib/reservation-item-snapshots";
import { reservationNameFieldsFromInput } from "@/lib/reservation-utils";

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
        data: {
          status: parsed.data.status,
          completedAt:
            parsed.data.status === "teslim_edildi"
              ? existing.completedAt ?? new Date()
              : existing.completedAt,
        },
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
        ...(data.brideFirstName !== undefined ||
        data.brideLastName !== undefined ||
        data.groomFirstName !== undefined ||
        data.groomLastName !== undefined
          ? reservationNameFieldsFromInput({
              brideFirstName: data.brideFirstName ?? existing.brideFirstName,
              brideLastName: data.brideLastName ?? existing.brideLastName,
              groomFirstName: data.groomFirstName ?? existing.groomFirstName,
              groomLastName: data.groomLastName ?? existing.groomLastName,
            })
          : {}),
        brideTc: data.brideTc,
        bridePhone: data.bridePhone,
        groomTc: data.groomTc,
        groomPhone: data.groomPhone,
        totalPrice: data.totalPrice,
        cancellationFeeMax: data.cancellationFeeMax,
        discountAmount: data.discountAmount,
        discountEnabled: data.discountEnabled ?? false,
        postShoot: data.postShoot,
        notes: data.notes !== undefined ? data.notes : undefined,
        status: data.status,
        completedAt:
          data.status === "teslim_edildi"
            ? existing.completedAt ?? new Date()
            : existing.completedAt,
      },
    });

    if (data.status && existing.status !== data.status) {
      await addReservationStatusHistory(id, data.status);
    }

    if (data.items) {
      const existingItems = await prisma.reservationItem.findMany({
        where: { reservationId: id },
        select: { packageOptionId: true, productSnapshot: true },
      });
      const preservedSnapshots = new Map(
        existingItems.map((item) => [item.packageOptionId, item.productSnapshot]),
      );

      await prisma.reservationItem.deleteMany({ where: { reservationId: id } });
      const itemCreates = await buildReservationItemCreates(
        id,
        data.items,
        preservedSnapshots,
      );
      await prisma.reservationItem.createMany({
        data: itemCreates,
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
          dueDate: parseDateOnlyInput(installment.dueDate),
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

    await prisma.reservation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/reservations/[id]", error);
    return NextResponse.json(
      { error: "Rezervasyon silinemedi" },
      { status: 500 },
    );
  }
}
