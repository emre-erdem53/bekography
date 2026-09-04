import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { calculateCancellationFeeMax, getEarliestShootDateInput } from "@/lib/cancellation-fee";
import { parseDateOnlyInput, toDateInputValue } from "@/lib/date-only";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  addReservationStatusHistory,
  findShootDateConflicts,
  getTrackingUrl,
} from "@/lib/reservations";
import { formatZodError } from "@/lib/validation-errors";
import {
  updateReservationSchema,
  updateReservationStatusSchema,
} from "@/lib/validations";
import { buildReservationItemCreates } from "@/lib/reservation-item-snapshots";
import { remapItemStageTagsByKeys } from "@/lib/item-workflow-stage-tags";
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
            shootType: { include: { package: { include: { serviceArea: true } } } },
          },
          orderBy: { shootDate: "asc" },
        },
        installments: { orderBy: { sortOrder: "asc" } },
        request: {
          include: {
            items: {
              include: {
                shootType: { include: { package: { include: { serviceArea: true } } } },
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
        { error: formatZodError(parsed.error) },
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

    const resolvedTotalPrice = data.totalPrice ?? existing.totalPrice;
    const shootDateInputs = data.items
      ? data.items.map((item) => item.shootDate)
      : (
          await prisma.reservationItem.findMany({
            where: { reservationId: id },
            select: { shootDate: true },
            orderBy: { shootDate: "asc" },
          })
        ).map((item) => toDateInputValue(item.shootDate));
    const cancellationFeeMax = calculateCancellationFeeMax(
      resolvedTotalPrice,
      getEarliestShootDateInput(shootDateInputs),
    );

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
        cancellationFeeMax,
        discountAmount: data.discountAmount,
        discountEnabled: data.discountEnabled ?? false,
        postShoot: data.postShoot,
        notes: data.notes !== undefined ? data.notes : undefined,
        status:
          data.status ??
          (existing.status === "taslak" ? "planlandi" : existing.status),
        draftPayload: existing.status === "taslak" ? Prisma.DbNull : undefined,
        completedAt:
          data.status === "teslim_edildi"
            ? existing.completedAt ?? new Date()
            : existing.completedAt,
      },
    });

    const nextStatus =
      data.status ??
      (existing.status === "taslak" ? "planlandi" : existing.status);
    if (nextStatus && existing.status !== nextStatus) {
      await addReservationStatusHistory(id, nextStatus);
    }

    if (data.items) {
      const existingItems = await prisma.reservationItem.findMany({
        where: { reservationId: id },
        select: { shootTypeId: true, productSnapshot: true },
      });
      const preservedSnapshots = new Map(
        existingItems.map((item) => [item.shootTypeId, item.productSnapshot]),
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

      if (data.postShoot?.itemStageTags) {
        const recreatedItems = await prisma.reservationItem.findMany({
          where: { reservationId: id },
          orderBy: { shootDate: "asc" },
        });
        const keyToId = new Map(
          data.items
            .map((item, index) => [
              item.itemKey ?? `${item.shootTypeId}:${index}`,
              recreatedItems[index]?.id ?? "",
            ] as const)
            .filter(([, itemId]) => Boolean(itemId)),
        );
        const remappedTags = remapItemStageTagsByKeys(
          data.postShoot.itemStageTags,
          keyToId,
        );
        if (remappedTags) {
          await prisma.reservation.update({
            where: { id },
            data: {
              postShoot: {
                ...data.postShoot,
                itemStageTags: remappedTags,
              },
            },
          });
        }
      }
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
            shootType: { include: { package: { include: { serviceArea: true } } } },
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
