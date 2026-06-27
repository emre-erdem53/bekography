import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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
