import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { prismaWriteErrorResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation-errors";
import { updatePackageSchema } from "@/lib/validations";

function jsonContent(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

const packageInclude = {
  serviceArea: true,
  shootTypes: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.PackageInclude;

/** Talep/rezervasyonlarda kullanılan çekim türleri silinemez (FK RESTRICT). */
async function findLockedShootTypeIds(shootTypeIds: string[]) {
  if (shootTypeIds.length === 0) return new Set<string>();

  const [requestItems, reservationItems] = await Promise.all([
    prisma.requestItem.findMany({
      where: { shootTypeId: { in: shootTypeIds } },
      select: { shootTypeId: true },
    }),
    prisma.reservationItem.findMany({
      where: { shootTypeId: { in: shootTypeIds } },
      select: { shootTypeId: true },
    }),
  ]);

  return new Set([
    ...requestItems.map((item) => item.shootTypeId),
    ...reservationItems.map((item) => item.shootTypeId),
  ]);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: packageInclude,
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("GET /api/admin/packages/[id]", error);
    return NextResponse.json({ error: "Paket yüklenemedi" }, { status: 500 });
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
    const parsed = updatePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const existing = await prisma.package.findUnique({
      where: { id },
      include: { shootTypes: { select: { id: true } }, serviceArea: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    if (data.serviceAreaId && data.serviceAreaId !== existing.serviceAreaId) {
      const target = await prisma.serviceArea.findUnique({
        where: { id: data.serviceAreaId },
        select: { id: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Seçilen hizmet alanı bulunamadı." },
          { status: 400 },
        );
      }
    }

    const existingIds = new Set(existing.shootTypes.map((row) => row.id));

    // Formdan kaldırılan çekim türleri artık gerçekten siliniyor.
    let removedIds: string[] = [];
    if (data.shootTypes) {
      const keptIds = new Set(
        data.shootTypes
          .map((shootType) => shootType.id)
          .filter((shootTypeId): shootTypeId is string =>
            Boolean(shootTypeId && existingIds.has(shootTypeId)),
          ),
      );
      removedIds = [...existingIds].filter(
        (shootTypeId) => !keptIds.has(shootTypeId),
      );

      const locked = await findLockedShootTypeIds(removedIds);
      if (locked.size > 0) {
        const lockedLabels = await prisma.shootType.findMany({
          where: { id: { in: [...locked] } },
          select: { label: true },
        });
        return NextResponse.json(
          {
            error: `${lockedLabels
              .map((row) => row.label)
              .join(", ")} çekim türü talep veya rezervasyonlarda kullanıldığı için kaldırılamaz. Kaldırmak yerine pasife alabilirsiniz.`,
          },
          { status: 409 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.package.update({
        where: { id },
        data: {
          ...(data.serviceAreaId ? { serviceAreaId: data.serviceAreaId } : {}),
          title: data.title,
          ...(data.slug ? { slug: data.slug } : {}),
          iconKey: data.iconKey,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          tags: data.tags,
        },
      });

      if (!data.shootTypes) return;

      if (removedIds.length > 0) {
        await tx.shootType.deleteMany({ where: { id: { in: removedIds } } });
      }

      for (const [index, shootType] of data.shootTypes.entries()) {
        const shootTypeData = {
          label: shootType.label,
          cashPrice: shootType.cashPrice,
          installmentPrice: shootType.installmentPrice,
          iconKey: shootType.iconKey ?? null,
          sortOrder: shootType.sortOrder ?? index,
          isActive: shootType.isActive ?? true,
          tags: shootType.tags ?? [],
          ...(shootType.content
            ? { content: jsonContent(shootType.content) }
            : {}),
        };

        if (shootType.id && existingIds.has(shootType.id)) {
          await tx.shootType.update({
            where: { id: shootType.id },
            data: shootTypeData,
          });
          continue;
        }

        await tx.shootType.create({
          data: { packageId: id, ...shootTypeData },
        });
      }
    });

    const updated = await prisma.package.findUnique({
      where: { id },
      include: packageInclude,
    });

    revalidatePath("/paketler");
    if (updated) revalidatePath(`/paketler/${updated.serviceArea.slug}`);
    if (existing.serviceArea.slug !== updated?.serviceArea.slug) {
      revalidatePath(`/paketler/${existing.serviceArea.slug}`);
    }

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

    const shootTypes = await prisma.shootType.findMany({
      where: { packageId: id },
      select: { id: true },
    });

    const locked = await findLockedShootTypeIds(
      shootTypes.map((shootType) => shootType.id),
    );

    if (locked.size > 0) {
      return NextResponse.json(
        {
          error:
            "Bu paket talep veya rezervasyonlarda kullanıldığı için silinemez.",
        },
        { status: 409 },
      );
    }

    const deleted = await prisma.package.delete({
      where: { id },
      include: { serviceArea: { select: { slug: true } } },
    });

    revalidatePath("/paketler");
    revalidatePath(`/paketler/${deleted.serviceArea.slug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Paket bulunamadı" }, { status: 404 });
    }

    console.error("DELETE /api/admin/packages/[id]", error);
    return NextResponse.json({ error: "Paket silinemedi" }, { status: 500 });
  }
}
