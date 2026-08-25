import { prisma } from "@/lib/prisma";
import { normalizeHexColor } from "@/lib/color-utils";
import type {
  ServiceAreaContent,
  ShootTypeContent,
} from "@/lib/package-seed-data";
import type { ScheduleType, ServiceAreaData } from "@/lib/package-types";

/**
 * Aktiflik zinciri: aktif hizmet alanı → en az bir aktif paket → en az bir
 * aktif çekim türü. Bir seviye pasifse altındakiler vitrinde görünmez.
 */
export async function getActivePackages() {
  return prisma.serviceArea.findMany({
    where: {
      isActive: true,
      packages: {
        some: { isActive: true, shootTypes: { some: { isActive: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        where: { isActive: true, shootTypes: { some: { isActive: true } } },
        orderBy: { sortOrder: "asc" },
        include: {
          shootTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function getAllPackages() {
  return prisma.serviceArea.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        orderBy: { sortOrder: "asc" },
        include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

export async function getActiveServiceAreaBySlug(slug: string) {
  return prisma.serviceArea.findFirst({
    where: {
      slug,
      isActive: true,
      packages: {
        some: { isActive: true, shootTypes: { some: { isActive: true } } },
      },
    },
    include: {
      packages: {
        where: { isActive: true, shootTypes: { some: { isActive: true } } },
        orderBy: { sortOrder: "asc" },
        include: {
          shootTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

type ServiceAreaRow = Awaited<ReturnType<typeof getActivePackages>>[number];

export function serializeServiceArea(
  serviceArea: ServiceAreaRow,
): ServiceAreaData {
  return {
    id: serviceArea.id,
    slug: serviceArea.slug,
    title: serviceArea.title,
    accentColor:
      normalizeHexColor(serviceArea.accentColor) ?? serviceArea.accentColor,
    iconKey: serviceArea.iconKey,
    highlight: serviceArea.highlight,
    backgroundImageUrl: serviceArea.backgroundImageUrl,
    heroImageUrl: serviceArea.heroImageUrl,
    scheduleType: serviceArea.scheduleType as ScheduleType,
    isCompanionOnly: serviceArea.isCompanionOnly,
    tags: serviceArea.tags,
    content: (serviceArea.content ?? {}) as ServiceAreaContent,
    packages: serviceArea.packages.map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      title: pkg.title,
      iconKey: pkg.iconKey,
      tags: pkg.tags,
      shootTypes: pkg.shootTypes.map((shootType) => ({
        id: shootType.id,
        label: shootType.label,
        cashPrice: shootType.cashPrice,
        installmentPrice: shootType.installmentPrice,
        iconKey: shootType.iconKey,
        tags: shootType.tags,
        content: (shootType.content ?? {}) as ShootTypeContent,
      })),
    })),
  };
}

export function serializeServiceAreas(
  serviceAreas: ServiceAreaRow[],
): ServiceAreaData[] {
  return serviceAreas.map(serializeServiceArea);
}
