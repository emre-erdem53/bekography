import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { prismaWriteErrorResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation-errors";
import { serviceAreaSchema } from "@/lib/validations";
import { slugify } from "@/lib/constants";

function jsonContent(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const serviceAreas = await prisma.serviceArea.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        packages: {
          orderBy: { sortOrder: "asc" },
          include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
    return NextResponse.json(serviceAreas);
  } catch (error) {
    console.error("GET /api/admin/service-areas", error);
    return NextResponse.json(
      { error: "Hizmet alanları yüklenemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = await request.json();
    const parsed = serviceAreaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const slug = data.slug ?? slugify(data.title);

    const serviceArea = await prisma.serviceArea.create({
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
        scheduleType: data.scheduleType ?? "indoor",
        isCompanionOnly: data.isCompanionOnly ?? false,
        tags: data.tags ?? [],
        content: jsonContent(data.content ?? { services: [] }),
      },
      include: { packages: { include: { shootTypes: true } } },
    });

    revalidatePath("/paketler");

    return NextResponse.json(serviceArea, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/service-areas", error);
    const mapped = prismaWriteErrorResponse(
      error,
      "Hizmet alanı oluşturulamadı",
    );
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
