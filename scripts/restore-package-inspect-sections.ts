/**
 * Tüm paketlere tam Açıklama bölümlerini (REZERVASYON, ÇEKİM, …) yazar.
 * Düğün Salon gibi zaten zengin içeriği olan paketleri korur; diğerlerini doldurur.
 *
 * Kullanım: npx tsx scripts/restore-package-inspect-sections.ts
 */
import { PrismaClient } from "@prisma/client";
import type { PackageCategoryContent } from "../src/lib/package-seed-data";
import {
  hasRichInspectSections,
  syncDetailSectionsByOptionForCategory,
} from "../src/lib/package-inspect-templates";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.packageCategory.findMany({
    include: {
      options: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  for (const category of categories) {
    const content = (category.content ?? {}) as PackageCategoryContent;
    const existingByOption = content.detailSectionsByOption ?? {};

    const alreadyRich = category.options.every((option) => {
      const sections = [
        ...(existingByOption[option.id] ?? []),
        ...(existingByOption[option.label.trim()] ?? []),
      ];
      return hasRichInspectSections(sections);
    });

    const nextByOption = syncDetailSectionsByOptionForCategory(
      category.slug,
      category.title,
      content.scheduleType,
      category.options.map((option) => ({
        id: option.id,
        label: option.label,
      })),
      existingByOption,
    );

    const nextContent: PackageCategoryContent = {
      ...content,
      detailSectionsByOption: nextByOption,
    };

    const changed =
      JSON.stringify(existingByOption) !== JSON.stringify(nextByOption);

    if (!changed) {
      console.log(`Skip ${category.slug}: zaten güncel`);
      continue;
    }

    await prisma.packageCategory.update({
      where: { id: category.id },
      data: { content: nextContent },
    });

    console.log(
      `${alreadyRich ? "Sync" : "Restore"} ${category.slug}: ${category.options.length} çekim türü`,
    );
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
