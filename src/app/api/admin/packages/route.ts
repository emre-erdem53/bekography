import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllPackages } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { packageCategorySchema } from "@/lib/validations";
import { slugify } from "@/lib/constants";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const categories = await getAllPackages();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/admin/packages", error);
    return NextResponse.json(
      { error: "Paketler yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = packageCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const slug = data.slug ?? slugify(data.title);

    const category = await prisma.packageCategory.create({
      data: {
        title: data.title,
        slug,
        accentColor: data.accentColor,
        iconKey: data.iconKey,
        highlight: data.highlight ?? false,
        backgroundImageUrl: data.backgroundImageUrl ?? null,
        heroImageUrl: data.heroImageUrl ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        content: (data.content ?? {}) as Prisma.InputJsonValue,
        options: data.options
          ? {
              create: data.options.map((option, index) => ({
                label: option.label,
                cashPrice: option.cashPrice,
                installmentPrice: option.installmentPrice,
                sortOrder: option.sortOrder ?? index,
                isActive: option.isActive ?? true,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/packages", error);
    return NextResponse.json(
      { error: "Paket oluşturulamadı" },
      { status: 500 },
    );
  }
}
