/**
 * Mevcut paket kayıtlarına eksik İncele bölümlerini (Dijital/Düzenleme/Baskı) ekler.
 * Kullanım: npx tsx scripts/backfill-package-inspect-sections.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  enrichSeedCategoryContent,
  type PackageCategoryContent,
} from "../src/lib/package-seed-data";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.packageCategory.findMany({
    include: { options: true },
  });

  for (const category of categories) {
    const content = (category.content ?? {}) as PackageCategoryContent;
    const optionLabels = category.options.map((option) => option.label);
    const enriched = enrichSeedCategoryContent(
      category.slug,
      content,
      optionLabels,
    );

    const before = JSON.stringify(content.detailSectionsByOption ?? {});
    const after = JSON.stringify(enriched.detailSectionsByOption ?? {});

    if (before === after) {
      console.log(`Skip ${category.slug}: already has inspect sections`);
      continue;
    }

    await prisma.packageCategory.update({
      where: { id: category.id },
      data: { content: enriched },
    });
    console.log(`Updated ${category.slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
