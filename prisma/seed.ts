import { PrismaClient, Prisma } from "@prisma/client";
import { seedPackageCategories } from "../src/lib/package-seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding package categories...");

  for (const category of seedPackageCategories) {
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
        content: category.content as Prisma.InputJsonValue,
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
        content: category.content as Prisma.InputJsonValue,
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
