import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { prismaWriteErrorResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation-errors";
import { packageCategorySchema } from "@/lib/validations";

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
    const category = await prisma.packageCategory.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("GET /api/admin/packages/[id]", error);
    return NextResponse.json(
      { error: "Paket yüklenemedi" },
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
    const parsed = packageCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const existing = await prisma.packageCategory.findUnique({
      where: { id },
      include: { options: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    const existingOptionIds = new Set(existing.options.map((option) => option.id));

    await prisma.$transaction(async (tx) => {
      await tx.packageCategory.update({
        where: { id },
        data: {
          title: data.title,
          ...(data.slug ? { slug: data.slug } : {}),
          accentColor: data.accentColor,
          iconKey: data.iconKey,
          highlight: data.highlight,
          backgroundImageUrl: data.backgroundImageUrl,
          heroImageUrl: data.heroImageUrl,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          content: data.content ? jsonContent(data.content) : undefined,
        },
      });

      if (!data.options) return;

      for (const [index, option] of data.options.entries()) {
        const optionData = {
          label: option.label,
          cashPrice: option.cashPrice,
          installmentPrice: option.installmentPrice,
          sortOrder: option.sortOrder ?? index,
          isActive: option.isActive ?? true,
        };

        if (option.id && existingOptionIds.has(option.id)) {
          await tx.packageOption.update({
            where: { id: option.id },
            data: optionData,
          });
          continue;
        }

        await tx.packageOption.create({
          data: {
            categoryId: id,
            ...optionData,
          },
        });
      }
    });

    const updated = await prisma.packageCategory.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });

    revalidatePath("/paketler");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/packages/[id]", error);
    const mapped = prismaWriteErrorResponse(error, "Paket güncellenemedi");
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

    const options = await prisma.packageOption.findMany({
      where: { categoryId: id },
      select: { id: true },
    });
    const optionIds = options.map((option) => option.id);

    if (optionIds.length > 0) {
      const [requestItemCount, reservationItemCount] = await Promise.all([
        prisma.requestItem.count({
          where: { packageOptionId: { in: optionIds } },
        }),
        prisma.reservationItem.count({
          where: { packageOptionId: { in: optionIds } },
        }),
      ]);

      if (requestItemCount + reservationItemCount > 0) {
        return NextResponse.json(
          {
            error:
              "Bu paket talep veya rezervasyonlarda kullanıldığı için silinemez.",
          },
          { status: 409 },
        );
      }
    }

    await prisma.packageCategory.delete({ where: { id } });
    revalidatePath("/paketler");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    console.error("DELETE /api/admin/packages/[id]", error);
    return NextResponse.json(
      { error: "Paket silinemedi" },
      { status: 500 },
    );
  }
}
