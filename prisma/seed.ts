import { PrismaClient, Prisma } from "@prisma/client";
import {
  defaultRequestFieldLabels,
  seedServiceAreas,
  type SeedServiceArea,
  type ServiceAreaContent,
  type ShootTypeContent,
} from "../src/lib/package-seed-data";
import { buildPackageInspectSections } from "../src/lib/package-inspect-templates";

const prisma = new PrismaClient();

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function serviceAreaContent(area: SeedServiceArea): Prisma.InputJsonValue {
  const content: ServiceAreaContent = {
    services: area.content.services,
    requestFieldLabels:
      area.content.requestFieldLabels ??
      defaultRequestFieldLabels(area.title, area.scheduleType),
  };
  return jsonValue(content);
}

/** Yeni çekim türleri şablon Açıklama bölümleriyle gelir; mevcut içerik korunur. */
function shootTypeContent(
  area: SeedServiceArea,
  label: string,
): Prisma.InputJsonValue {
  const content: ShootTypeContent = {
    galleryMedia: [],
    detailSections: buildPackageInspectSections({
      slug: area.slug,
      categoryTitle: area.title,
      optionLabel: label,
      scheduleType: area.scheduleType,
    }),
    inspectEnabled: true,
  };
  return jsonValue(content);
}

async function main() {
  console.log("Seeding service areas, packages and shoot types...");

  for (const area of seedServiceAreas) {
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
    });

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
          accentColor: area.accentColor,
          sortOrder: seedPackage.sortOrder,
          tags: seedPackage.tags ?? [],
          isActive: true,
        },
        create: {
          serviceAreaId: serviceArea.id,
          slug: seedPackage.slug,
          title: seedPackage.title,
          accentColor: area.accentColor,
          sortOrder: seedPackage.sortOrder,
          tags: seedPackage.tags ?? [],
          isActive: true,
        },
        include: { shootTypes: true },
      });

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
            content: shootTypeContent(area, shootType.label),
          },
        });
      }
    }
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
