import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { updateRequestStatusSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const requestRecord = await prisma.request.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            shootType: { include: { package: { include: { serviceArea: true } } } },
          },
        },
        reservation: true,
      },
    });

    if (!requestRecord) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(requestRecord);
  } catch (error) {
    console.error("GET /api/admin/requests/[id]", error);
    return NextResponse.json(
      { error: "Talep yüklenemedi" },
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
    const parsed = updateRequestStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const updated = await prisma.request.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/requests/[id]", error);
    return NextResponse.json(
      { error: "Talep güncellenemedi" },
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

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    await prisma.request.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/requests/[id]", error);
    return NextResponse.json(
      { error: "Talep silinemedi" },
      { status: 500 },
    );
  }
}
