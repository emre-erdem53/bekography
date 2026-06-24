import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { RESERVATION_RESTORE_DAYS } from "@/lib/constants";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const existing = await prisma.reservation.findUnique({ where: { id } });

    if (!existing || !existing.deletedAt) {
      return NextResponse.json(
        { error: "Silinen rezervasyon bulunamadı" },
        { status: 404 },
      );
    }

    const daysSinceDelete = differenceInCalendarDays(
      new Date(),
      existing.deletedAt,
    );

    if (daysSinceDelete > RESERVATION_RESTORE_DAYS) {
      return NextResponse.json(
        {
          error: `Bu rezervasyon ${RESERVATION_RESTORE_DAYS} günden fazla süre önce silindiği için geri getirilemez.`,
        },
        { status: 400 },
      );
    }

    const restored = await prisma.reservation.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json(restored);
  } catch (error) {
    console.error("POST /api/admin/reservations/[id]/restore", error);
    return NextResponse.json(
      { error: "Rezervasyon geri getirilemedi" },
      { status: 500 },
    );
  }
}
