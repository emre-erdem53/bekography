import { PrismaClient, Prisma } from "@prisma/client";
import {
  defaultRequestFieldLabels,
  seedServiceAreas,
  type SeedServiceArea,
  type SeedShootType,
  type ServiceAreaContent,
  type ShootTypeContent,
} from "../src/lib/package-seed-data";
import { getCatalogInspectSections } from "../src/lib/package-inspect-catalog";
import { buildPackageInspectSections } from "../src/lib/package-inspect-templates";

const prisma = new PrismaClient();

const LEGACY_SERVICE_AREA_SLUGS = [
  "dugun",
  "kuafor",
  "full-hikaye",
  "soz-isteme",
  "kina",
  "nisan",
];

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function serviceAreaContent(area: SeedServiceArea): Prisma.InputJsonValue {
  const content: ServiceAreaContent = {
    services: area.content.services,
    subtitle: area.content.subtitle ?? "",
    requestFieldLabels:
      area.content.requestFieldLabels ??
      defaultRequestFieldLabels(area.title, area.scheduleType),
  };
  return jsonValue(content);
}

function resolveDetailSections(
  area: SeedServiceArea,
  packageSlug: string,
  label: string,
) {
  const fromCatalog = getCatalogInspectSections({
    areaSlug: area.slug,
    packageSlug,
    label,
  });
  if (fromCatalog) return fromCatalog;

  return buildPackageInspectSections({
    slug: area.slug,
    categoryTitle: area.title,
    optionLabel: label,
    scheduleType: area.scheduleType,
  });
}

function shootTypeContent(
  area: SeedServiceArea,
  packageSlug: string,
  shootType: SeedShootType,
  existingContent?: unknown,
): Prisma.InputJsonValue {
  const previous =
    existingContent &&
    typeof existingContent === "object" &&
    !Array.isArray(existingContent)
      ? (existingContent as Record<string, unknown>)
      : {};

  const content: ShootTypeContent = {
    galleryMedia: Array.isArray(previous.galleryMedia)
      ? (previous.galleryMedia as ShootTypeContent["galleryMedia"])
      : [],
    detailSections: resolveDetailSections(
      area,
      packageSlug,
      shootType.label,
    ),
    inspectEnabled: true,
    workflowStages: Array.isArray(previous.workflowStages)
      ? (previous.workflowStages as ShootTypeContent["workflowStages"])
      : undefined,
    workflowStageTags:
      previous.workflowStageTags &&
      typeof previous.workflowStageTags === "object"
        ? (previous.workflowStageTags as ShootTypeContent["workflowStageTags"])
        : undefined,
  };
  return jsonValue(content);
}

async function deactivateLegacyCatalog() {
  const legacyAreas = await prisma.serviceArea.findMany({
    where: { slug: { in: LEGACY_SERVICE_AREA_SLUGS } },
    include: { packages: { include: { shootTypes: true } } },
  });

  for (const area of legacyAreas) {
    for (const pkg of area.packages) {
      await prisma.shootType.updateMany({
        where: { packageId: pkg.id },
        data: { isActive: false },
      });
      await prisma.package.update({
        where: { id: pkg.id },
        data: { isActive: false },
      });
    }
    await prisma.serviceArea.update({
      where: { id: area.id },
      data: { isActive: false },
    });
    console.log(`deactivated legacy service area: ${area.slug}`);
  }
}

async function syncServiceAreaCatalog(area: SeedServiceArea) {
  const serviceArea = await prisma.serviceArea.upsert({
    where: { slug: area.slug },
    update: {
      title: area.title,
      accentColor: area.accentColor,
      iconKey: area.iconKey,
      highlight: area.highlight ?? false,
      backgroundImageUrl: area.backgroundImage ?? null,
      heroImageUrl: area.heroImage ?? null,
      sortOrder: area.sortOrder,
      scheduleType: area.scheduleType,
      isCompanionOnly: area.isCompanionOnly ?? false,
      tags: area.tags ?? [],
      content: serviceAreaContent(area),
      isActive: true,
    },
    create: {
      slug: area.slug,
      title: area.title,
      accentColor: area.accentColor,
      iconKey: area.iconKey,
      highlight: area.highlight ?? false,
      backgroundImageUrl: area.backgroundImage ?? null,
      heroImageUrl: area.heroImage ?? null,
      sortOrder: area.sortOrder,
      scheduleType: area.scheduleType,
      isCompanionOnly: area.isCompanionOnly ?? false,
      tags: area.tags ?? [],
      content: serviceAreaContent(area),
      isActive: true,
    },
    include: {
      packages: { include: { shootTypes: true } },
    },
  });

  const seedPackageSlugs = new Set(area.packages.map((pkg) => pkg.slug));

  for (const existingPackage of serviceArea.packages) {
    if (!seedPackageSlugs.has(existingPackage.slug)) {
      await prisma.shootType.updateMany({
        where: { packageId: existingPackage.id },
        data: { isActive: false },
      });
      await prisma.package.update({
        where: { id: existingPackage.id },
        data: { isActive: false },
      });
      console.log(
        `deactivated package: ${area.slug}/${existingPackage.slug}`,
      );
    }
  }

  for (const seedPackage of area.packages) {
    const pkg = await prisma.package.upsert({
      where: {
        serviceAreaId_slug: {
          serviceAreaId: serviceArea.id,
          slug: seedPackage.slug,
        },
      },
      update: {
        title: seedPackage.title,
        accentColor: null,
        sortOrder: seedPackage.sortOrder,
        tags: seedPackage.tags ?? [],
        isActive: true,
      },
      create: {
        serviceAreaId: serviceArea.id,
        slug: seedPackage.slug,
        title: seedPackage.title,
        sortOrder: seedPackage.sortOrder,
        tags: seedPackage.tags ?? [],
        isActive: true,
      },
      include: { shootTypes: true },
    });

    const seedShootLabels = new Set(
      seedPackage.shootTypes.map((shootType) => shootType.label),
    );

    for (const existingShootType of pkg.shootTypes) {
      if (!seedShootLabels.has(existingShootType.label)) {
        await prisma.shootType.update({
          where: { id: existingShootType.id },
          data: { isActive: false },
        });
        console.log(
          `deactivated shoot type: ${area.slug}/${seedPackage.slug}/${existingShootType.label}`,
        );
      }
    }

    for (const [index, shootType] of seedPackage.shootTypes.entries()) {
      const existing = pkg.shootTypes.find(
        (row) => row.label === shootType.label,
      );

      if (existing) {
        await prisma.shootType.update({
          where: { id: existing.id },
          data: {
            cashPrice: shootType.cash,
            installmentPrice: shootType.installment,
            sortOrder: index,
            tags: shootType.tags ?? existing.tags,
            isActive: true,
            content: shootTypeContent(
              area,
              seedPackage.slug,
              shootType,
              existing.content,
            ),
          },
        });
        continue;
      }

      await prisma.shootType.create({
        data: {
          packageId: pkg.id,
          label: shootType.label,
          cashPrice: shootType.cash,
          installmentPrice: shootType.installment,
          sortOrder: index,
          tags: shootType.tags ?? [],
          isActive: true,
          content: shootTypeContent(area, seedPackage.slug, shootType),
        },
      });
    }
  }

  console.log(`synced: ${area.slug} (${area.packages.length} packages)`);
}

async function main() {
  console.log("Seeding service areas, packages and shoot types...");

  await deactivateLegacyCatalog();

  for (const area of seedServiceAreas) {
    await syncServiceAreaCatalog(area);
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
