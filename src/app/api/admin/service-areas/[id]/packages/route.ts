import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { prismaWriteErrorResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation-errors";
import { serviceAreaPackagesSchema } from "@/lib/validations";
import { slugify } from "@/lib/constants";

function jsonContent(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

const serviceAreaPackagesInclude = {
  packages: {
    orderBy: { sortOrder: "asc" },
    include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
  },
} satisfies Prisma.ServiceAreaInclude;

/** Talep/rezervasyonlarda kullanılan çekim türleri silinemez (FK RESTRICT). */
async function findLockedShootTypes(shootTypeIds: string[]) {
  if (shootTypeIds.length === 0) return [] as string[];

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

  const locked = new Set([
    ...requestItems.map((item) => item.shootTypeId),
    ...reservationItems.map((item) => item.shootTypeId),
  ]);

  if (locked.size === 0) return [];

  const rows = await prisma.shootType.findMany({
    where: { id: { in: [...locked] } },
    select: { label: true, package: { select: { title: true } } },
  });

  return rows.map((row) => `${row.package.title} › ${row.label}`);
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
      include: serviceAreaPackagesInclude,
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: "Hizmet alanı bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error("GET /api/admin/service-areas/[id]/packages", error);
    return NextResponse.json({ error: "Paketler yüklenemedi" }, { status: 500 });
  }
}

/**
 * Hizmet alanının paket listesini tek işlemde senkronize eder: gönderilmeyen
 * paketler ve çekim türleri silinir, mevcut olanlar güncellenir, yeniler
 * oluşturulur. Silinecek çekim türü bir talep/rezervasyonda kullanılıyorsa
 * hiçbir değişiklik uygulanmaz.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = serviceAreaPackagesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const serviceArea = await prisma.serviceArea.findUnique({
      where: { id },
      include: {
        packages: { include: { shootTypes: { select: { id: true } } } },
      },
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: "Hizmet alanı bulunamadı" },
        { status: 404 },
      );
    }

    // Slug'lar hizmet alanı içinde tekil olmalı (@@unique([serviceAreaId, slug])).
    const incoming = parsed.data.packages.map((pkg, index) => ({
      ...pkg,
      slug: (pkg.slug?.trim() || slugify(pkg.title)) || `paket-${index + 1}`,
    }));

    const seenSlugs = new Map<string, string>();
    for (const pkg of incoming) {
      const previousTitle = seenSlugs.get(pkg.slug);
      if (previousTitle) {
        return NextResponse.json(
          {
            error: `"${previousTitle}" ve "${pkg.title}" paketleri aynı bağlantı adını (${pkg.slug}) kullanıyor. Paket başlıklarını farklılaştırın veya bağlantı adını elle değiştirin.`,
          },
          { status: 409 },
        );
      }
      seenSlugs.set(pkg.slug, pkg.title);
    }

    const existingPackages = serviceArea.packages;
    const existingPackageIds = new Set(existingPackages.map((pkg) => pkg.id));
    const keptPackageIds = new Set(
      incoming
        .map((pkg) => pkg.id)
        .filter((packageId): packageId is string =>
          Boolean(packageId && existingPackageIds.has(packageId)),
        ),
    );

    const removedPackages = existingPackages.filter(
      (pkg) => !keptPackageIds.has(pkg.id),
    );

    // Çekim türü yalnızca hâlâ aynı paketin altında gönderildiyse korunur;
    // paketi kaldırılan çekim türleri de silinir.
    const shootTypeOwner = new Map<string, string>();
    for (const pkg of existingPackages) {
      for (const shootType of pkg.shootTypes) {
        shootTypeOwner.set(shootType.id, pkg.id);
      }
    }

    const keptShootTypeIds = new Set(
      incoming.flatMap((pkg) =>
        pkg.shootTypes
          .map((shootType) => shootType.id)
          .filter(
            (shootTypeId): shootTypeId is string =>
              Boolean(shootTypeId) &&
              shootTypeOwner.get(shootTypeId as string) === pkg.id,
          ),
      ),
    );
    const removedShootTypeIds = [...shootTypeOwner.keys()].filter(
      (shootTypeId) => !keptShootTypeIds.has(shootTypeId),
    );

    const lockedLabels = await findLockedShootTypes(removedShootTypeIds);
    if (lockedLabels.length > 0) {
      return NextResponse.json(
        {
          error: `${lockedLabels.join(", ")} çekim türü talep veya rezervasyonlarda kullanıldığı için kaldırılamaz. Kaldırmak yerine pasife alabilirsiniz.`,
        },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (removedShootTypeIds.length > 0) {
        await tx.shootType.deleteMany({
          where: { id: { in: removedShootTypeIds } },
        });
      }

      if (removedPackages.length > 0) {
        await tx.package.deleteMany({
          where: { id: { in: removedPackages.map((pkg) => pkg.id) } },
        });
      }

      for (const [packageIndex, pkg] of incoming.entries()) {
        const packageData = {
          title: pkg.title,
          slug: pkg.slug,
          iconKey: pkg.iconKey ?? null,
          sortOrder: pkg.sortOrder ?? packageIndex,
          isActive: pkg.isActive ?? true,
          tags: pkg.tags ?? [],
        };

        const packageId =
          pkg.id && existingPackageIds.has(pkg.id)
            ? (
                await tx.package.update({
                  where: { id: pkg.id },
                  data: packageData,
                  select: { id: true },
                })
              ).id
            : (
                await tx.package.create({
                  data: { serviceAreaId: id, ...packageData },
                  select: { id: true },
                })
              ).id;

        for (const [shootTypeIndex, shootType] of pkg.shootTypes.entries()) {
          const shootTypeData = {
            label: shootType.label,
            cashPrice: shootType.cashPrice,
            installmentPrice: shootType.installmentPrice,
            iconKey: shootType.iconKey ?? null,
            sortOrder: shootType.sortOrder ?? shootTypeIndex,
            isActive: shootType.isActive ?? true,
            tags: shootType.tags ?? [],
            content: jsonContent(shootType.content ?? {}),
          };

          if (shootType.id && keptShootTypeIds.has(shootType.id)) {
            await tx.shootType.update({
              where: { id: shootType.id },
              data: { packageId, ...shootTypeData },
            });
            continue;
          }

          await tx.shootType.create({
            data: { packageId, ...shootTypeData },
          });
        }
      }
    });

    const updated = await prisma.serviceArea.findUnique({
      where: { id },
      include: serviceAreaPackagesInclude,
    });

    revalidatePath("/paketler");
    revalidatePath(`/paketler/${serviceArea.slug}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/service-areas/[id]/packages", error);
    const mapped = prismaWriteErrorResponse(error, "Paketler kaydedilemedi");
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
