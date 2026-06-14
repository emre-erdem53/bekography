import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { packageCategorySchema } from "@/lib/validations";
import { slugify } from "@/lib/constants";

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
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const category = await prisma.packageCategory.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug ?? (data.title ? slugify(data.title) : undefined),
        accentColor: data.accentColor,
        iconKey: data.iconKey,
        highlight: data.highlight,
        backgroundImageUrl: data.backgroundImageUrl,
        heroImageUrl: data.heroImageUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        content: data.content as Prisma.InputJsonValue | undefined,
      },
    });

    if (data.options) {
      for (const [index, option] of data.options.entries()) {
        if (option.id) {
          await prisma.packageOption.update({
            where: { id: option.id },
            data: {
              label: option.label,
              cashPrice: option.cashPrice,
              installmentPrice: option.installmentPrice,
              sortOrder: option.sortOrder ?? index,
              isActive: option.isActive ?? true,
            },
          });
        } else {
          await prisma.packageOption.create({
            data: {
              categoryId: id,
              label: option.label,
              cashPrice: option.cashPrice,
              installmentPrice: option.installmentPrice,
              sortOrder: option.sortOrder ?? index,
              isActive: option.isActive ?? true,
            },
          });
        }
      }
    }

    const updated = await prisma.packageCategory.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/packages/[id]", error);
    return NextResponse.json(
      { error: "Paket güncellenemedi" },
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
    await prisma.packageCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/packages/[id]", error);
    return NextResponse.json(
      { error: "Paket silinemedi" },
      { status: 500 },
    );
  }
}
