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

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing || !existing.deletedAt) {
      return NextResponse.json(
        { error: "Silinen talep bulunamadı" },
        { status: 404 },
      );
    }

    await prisma.request.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/requests/[id]/restore", error);
    return NextResponse.json(
      { error: "Talep geri getirilemedi" },
      { status: 500 },
    );
  }
}
