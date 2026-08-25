import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllPackages } from "@/lib/packages";
import { prisma } from "@/lib/prisma";
import { prismaWriteErrorResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation-errors";
import { packageSchema } from "@/lib/validations";
import { slugify } from "@/lib/constants";

function jsonContent(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const serviceAreas = await getAllPackages();
    return NextResponse.json(serviceAreas);
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
    const parsed = packageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const serviceArea = await prisma.serviceArea.findUnique({
      where: { id: data.serviceAreaId },
      select: { id: true, slug: true },
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: "Seçilen hizmet alanı bulunamadı. Sayfayı yenileyip tekrar deneyin." },
        { status: 400 },
      );
    }

    const slug = data.slug ?? slugify(data.title);

    const created = await prisma.package.create({
      data: {
        serviceAreaId: serviceArea.id,
        title: data.title,
        slug,
        iconKey: data.iconKey ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
        tags: data.tags ?? [],
        shootTypes: {
          create: data.shootTypes.map((shootType, index) => ({
            label: shootType.label,
            cashPrice: shootType.cashPrice,
            installmentPrice: shootType.installmentPrice,
            iconKey: shootType.iconKey ?? null,
            sortOrder: shootType.sortOrder ?? index,
            isActive: shootType.isActive ?? true,
            tags: shootType.tags ?? [],
            content: jsonContent(shootType.content ?? {}),
          })),
        },
      },
      include: {
        serviceArea: true,
        shootTypes: { orderBy: { sortOrder: "asc" } },
      },
    });

    revalidatePath("/paketler");
    revalidatePath(`/paketler/${serviceArea.slug}`);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/packages", error);
    const mapped = prismaWriteErrorResponse(error, "Paket oluşturulamadı");
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
