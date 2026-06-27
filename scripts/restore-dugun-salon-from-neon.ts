/**
 * Neon PITR dalından düğün salon galerisini geri yükler.
 * Kullanım: RECOVERY_DATABASE_URL=... npx tsx scripts/restore-dugun-salon-from-neon.ts
 */
import { PrismaClient } from "@prisma/client";
import { mergeGalleryMediaByOption } from "../src/lib/package-gallery-persist";
import type {
  PackageCategoryContent,
  PackageGalleryMedia,
} from "../src/lib/package-seed-data";

const recoveryUrl = process.env.RECOVERY_DATABASE_URL;
if (!recoveryUrl) {
  console.error("RECOVERY_DATABASE_URL gerekli");
  process.exit(1);
}

const recovery = new PrismaClient({
  datasources: { db: { url: recoveryUrl } },
});
const prisma = new PrismaClient();

async function run() {
  const rec = await recovery.packageCategory.findFirst({
    where: { slug: "dugun-salon" },
  });
  if (!rec?.content) {
    throw new Error("Recovery branch: dugun-salon bulunamadı");
  }

  const recovered = (rec.content as PackageCategoryContent)
    .galleryMediaByOption as Record<string, PackageGalleryMedia[]>;

  const category = await prisma.packageCategory.findFirst({
    where: { slug: "dugun-salon" },
  });
  if (!category) throw new Error("dugun-salon bulunamadı");

  const content = (category.content ?? {}) as PackageCategoryContent;
  const merged = mergeGalleryMediaByOption(
    content.galleryMediaByOption,
    recovered,
  );

  await prisma.packageCategory.update({
    where: { id: category.id },
    data: {
      content: {
        ...content,
        galleryMediaByOption: merged,
      },
    },
  });

  const total = Object.values(merged).reduce(
    (n, media) => n + (Array.isArray(media) ? media.length : 0),
    0,
  );
  console.log(`dugun-salon geri yüklendi: ${total} medya`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await recovery.$disconnect();
    await prisma.$disconnect();
  });
