import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const approvedWithoutReservation = await prisma.request.findMany({
      where: {
        status: "onaylandi",
        deletedAt: null,
        reservation: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
      },
    });

    return NextResponse.json(approvedWithoutReservation);
  } catch (error) {
    console.error("GET /api/admin/alerts", error);
    return NextResponse.json(
      { error: "Uyarılar yüklenemedi" },
      { status: 500 },
    );
  }
}
