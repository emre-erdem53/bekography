import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            packageOption: { include: { category: true } },
          },
        },
        reservation: true,
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/admin/requests", error);
    return NextResponse.json(
      { error: "Talepler yüklenemedi" },
      { status: 500 },
    );
  }
}
