import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import type { PackageCategoryContent } from "../src/lib/package-seed-data";
import { normalizeDetailSections } from "../src/lib/package-detail-section";

async function main() {
  const categories = await prisma.packageCategory.findMany({
    select: { id: true, slug: true, content: true },
  });

  let updatedCount = 0;

  for (const category of categories) {
    const content = (category.content ?? {}) as PackageCategoryContent;
    let changed = false;

    const nextContent: PackageCategoryContent = { ...content };

    if (content.detailSections?.length) {
      const normalized = normalizeDetailSections(content.detailSections);
      if (JSON.stringify(normalized) !== JSON.stringify(content.detailSections)) {
        nextContent.detailSections = normalized;
        changed = true;
      }
    }

    if (content.detailSectionsByOption) {
      const nextByOption: NonNullable<
        PackageCategoryContent["detailSectionsByOption"]
      > = {};
      for (const [key, sections] of Object.entries(
        content.detailSectionsByOption,
      )) {
        const normalized = normalizeDetailSections(sections);
        nextByOption[key] = normalized;
        if (JSON.stringify(normalized) !== JSON.stringify(sections)) {
          changed = true;
        }
      }
      nextContent.detailSectionsByOption = nextByOption;
    }

    if (!changed) continue;

    await prisma.packageCategory.update({
      where: { id: category.id },
      data: { content: nextContent as Prisma.InputJsonValue },
    });

    updatedCount += 1;
    console.log(`Updated ${category.slug}`);
  }

  console.log(`Migration complete. Updated ${updatedCount} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
