import { PrismaClient, Prisma } from "@prisma/client";
import {
  defaultRequestFieldLabels,
  seedPackageCategories,
} from "../src/lib/package-seed-data";

const prisma = new PrismaClient();

function enrichContent(
  category: (typeof seedPackageCategories)[number],
): Prisma.InputJsonValue {
  const scheduleType = category.content.scheduleType ?? "indoor";
  const galleryImages = category.content.galleryImages ?? [];
  const galleryMedia = galleryImages.map((image) => ({
    url: image.url,
    alt: image.alt,
    type: "image" as const,
  }));
  const galleryMediaByOption = Object.fromEntries(
    category.options.map((option) => [option.label, galleryMedia]),
  );

  return {
    ...category.content,
    requestFieldLabels:
      category.content.requestFieldLabels ??
      defaultRequestFieldLabels(category.title, scheduleType),
    highlightTags: category.content.highlightTags ?? [],
    galleryImages,
    galleryMediaByOption:
      category.content.galleryMediaByOption ?? galleryMediaByOption,
    detailSections: category.content.detailSections ?? [],
  } as Prisma.InputJsonValue;
}

async function main() {
  console.log("Seeding package categories...");

  for (const category of seedPackageCategories) {
    const content = enrichContent(category);
    await prisma.packageCategory.upsert({
      where: { slug: category.slug },
      update: {
        title: category.title,
        accentColor: category.accentColor,
        iconKey: category.iconKey,
        highlight: category.highlight ?? false,
        backgroundImageUrl: category.backgroundImage ?? null,
        heroImageUrl: category.heroImage ?? null,
        sortOrder: category.sortOrder,
        content,
        isActive: true,
      },
      create: {
        slug: category.slug,
        title: category.title,
        accentColor: category.accentColor,
        iconKey: category.iconKey,
        highlight: category.highlight ?? false,
        backgroundImageUrl: category.backgroundImage ?? null,
        heroImageUrl: category.heroImage ?? null,
        sortOrder: category.sortOrder,
        content,
        isActive: true,
        options: {
          create: category.options.map((option, index) => ({
            label: option.label,
            cashPrice: option.cash,
            installmentPrice: option.installment,
            sortOrder: index,
            isActive: true,
          })),
        },
      },
    });

    const existing = await prisma.packageCategory.findUnique({
      where: { slug: category.slug },
      include: { options: true },
    });

    if (existing && existing.options.length === 0) {
      await prisma.packageOption.createMany({
        data: category.options.map((option, index) => ({
          categoryId: existing.id,
          label: option.label,
          cashPrice: option.cash,
          installmentPrice: option.installment,
          sortOrder: index,
          isActive: true,
        })),
      });
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
