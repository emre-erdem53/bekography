import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { prismaWriteErrorResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation-errors";
import { serviceAreaSchema } from "@/lib/validations";

function jsonContent(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const serviceArea = await prisma.serviceArea.findUnique({
      where: { id },
      include: {
        packages: {
          orderBy: { sortOrder: "asc" },
          include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: "Hizmet alanı bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error("GET /api/admin/service-areas/[id]", error);
    return NextResponse.json(
      { error: "Hizmet alanı yüklenemedi" },
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
    const parsed = serviceAreaSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updated = await prisma.serviceArea.update({
      where: { id },
      data: {
        title: data.title,
        // Slug yalnızca açıkça gönderildiğinde değişir; aksi halde mevcut kalır.
        ...(data.slug ? { slug: data.slug } : {}),
        accentColor: data.accentColor,
        iconKey: data.iconKey,
        highlight: data.highlight,
        backgroundImageUrl: data.backgroundImageUrl,
        heroImageUrl: data.heroImageUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        scheduleType: data.scheduleType,
        isCompanionOnly: data.isCompanionOnly,
        tags: data.tags,
        content: data.content ? jsonContent(data.content) : undefined,
      },
      include: {
        packages: {
          orderBy: { sortOrder: "asc" },
          include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    revalidatePath("/paketler");
    revalidatePath(`/paketler/${updated.slug}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/service-areas/[id]", error);
    const mapped = prismaWriteErrorResponse(
      error,
      "Hizmet alanı güncellenemedi",
    );
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
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

    const packageCount = await prisma.package.count({
      where: { serviceAreaId: id },
    });

    if (packageCount > 0) {
      return NextResponse.json(
        {
          error: `Bu hizmet alanının altında ${packageCount} paket var. Önce paketleri silin veya başka bir hizmet alanına taşıyın.`,
        },
        { status: 409 },
      );
    }

    await prisma.serviceArea.delete({ where: { id } });
    revalidatePath("/paketler");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Hizmet alanı bulunamadı" },
        { status: 404 },
      );
    }

    console.error("DELETE /api/admin/service-areas/[id]", error);
    return NextResponse.json(
      { error: "Hizmet alanı silinemedi" },
      { status: 500 },
    );
  }
}
