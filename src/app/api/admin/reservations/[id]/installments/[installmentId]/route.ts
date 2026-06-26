import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const updateInstallmentPaidSchema = z.object({
  paid: z.boolean(),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; installmentId: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id, installmentId } = await params;
    const body = await request.json();
    const parsed = updateInstallmentPaidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
        { status: 400 },
      );
    }

    const installment = await prisma.reservationPaymentInstallment.findFirst({
      where: { id: installmentId, reservationId: id },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Ödeme vadesi bulunamadı" },
        { status: 404 },
      );
    }

    const updated = await prisma.reservationPaymentInstallment.update({
      where: { id: installmentId },
      data: { paidAt: parsed.data.paid ? new Date() : null },
    });

    return NextResponse.json({
      id: updated.id,
      amount: updated.amount,
      dueDate: updated.dueDate.toISOString(),
      paidAt: updated.paidAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/reservations/[id]/installments/[installmentId]",
      error,
    );
    return NextResponse.json(
      { error: "Ödeme durumu güncellenemedi" },
      { status: 500 },
    );
  }
}
