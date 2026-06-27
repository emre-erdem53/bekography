/**
 * Vercel Blob'daki paket galerisi dosyalarını listeler ve boş kategorilere geri yükler.
 *
 * Kullanım:
 *   BLOB_READ_WRITE_TOKEN=... npx tsx scripts/restore-package-gallery-from-blob.ts
 *   BLOB_READ_WRITE_TOKEN=... npx tsx scripts/restore-package-gallery-from-blob.ts --apply
 */
import { list } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { restorePackageGalleriesFromBlobs } from "../src/lib/restore-package-gallery";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function listAllBlobs() {
  const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return blobs;
}

async function main() {
  const blobs = await listAllBlobs();
  console.log(`Blob store: ${blobs.length} dosya\n`);

  const categories = await prisma.packageCategory.findMany({
    include: { options: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const result = restorePackageGalleriesFromBlobs(categories, blobs);

  console.log("=== Geri yüklenecek (tahmini eşleşme) ===\n");
  for (const category of categories) {
    const update = result.updates.find((item) => item.slug === category.slug);
    const content = (category.content ?? {}) as {
      galleryMediaByOption?: Record<string, unknown[]>;
    };
    const existingCount = Object.values(content.galleryMediaByOption ?? {}).reduce(
      (total, media) => total + (Array.isArray(media) ? media.length : 0),
      0,
    );
    console.log(
      `${category.slug.padEnd(14)} mevcut: ${existingCount}  +${update?.added ?? 0}`,
    );
  }

  console.log(
    `\nAtlanan (explore): ${result.skippedExplore}, bilinen: ${result.skippedKnown}`,
  );

  if (result.unmapped.length > 0) {
    console.log(`\nEşleşmeyen blob: ${result.unmapped.length}`);
    result.unmapped.slice(0, 20).forEach((path) => console.log(`- ${path}`));
  }

  if (!apply) {
    console.log("\nÖnizleme modu. DB'ye yazmak için: --apply");
    return;
  }

  console.log("\n=== DB güncelleniyor ===\n");
  for (const update of result.updates) {
    const category = categories.find((item) => item.slug === update.slug);
    if (!category) continue;
    const content = (category.content ?? {}) as Record<string, unknown>;
    await prisma.packageCategory.update({
      where: { id: category.id },
      data: {
        content: {
          ...content,
          galleryMediaByOption: update.galleryMediaByOption,
        },
      },
    });
    console.log(`✓ ${update.slug}: ${update.added} medya`);
  }

  console.log("\nGeri yükleme tamamlandı.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
