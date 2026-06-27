/**
 * Vercel Blob'daki dosyaları listeler; paket galerisi boş olan kayıtları raporlar.
 * Geri yükleme için admin panelden ilgili çekim türüne medyayı yeniden bağlamanız gerekir.
 *
 * Kullanım: BLOB_READ_WRITE_TOKEN=... npx tsx scripts/audit-package-gallery.ts
 */
import { list } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { countGalleryMediaItems } from "../src/lib/package-gallery-persist";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.packageCategory.findMany({
    include: { options: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  console.log("=== Paket galeri durumu ===\n");
  for (const category of categories) {
    const content = (category.content ?? {}) as {
      galleryMediaByOption?: Record<string, unknown[]>;
    };
    const count = countGalleryMediaItems(
      content.galleryMediaByOption as Record<string, import("../src/lib/package-seed-data").PackageGalleryMedia[]> | undefined,
    );
    console.log(
      `${category.slug.padEnd(14)} media: ${count}  updated: ${category.updatedAt.toISOString()}`,
    );
  }

  console.log("\n=== Vercel Blob (ilk 50) ===\n");
  try {
    const { blobs } = await list({ limit: 50 });
    console.log(`Toplam (sayfa): ${blobs.length}`);
    for (const blob of blobs) {
      console.log(`- ${blob.pathname}`);
    }
    console.log(
      "\nBlob dosyaları silinmemiş olabilir; paket kaydındaki URL referansları boşalmış olabilir.",
    );
    console.log(
      "Admin → Paketler → ilgili çekim türü → galeriye medyayı yeniden ekleyin.",
    );
  } catch (error) {
    console.error(
      "Blob listelenemedi. BLOB_READ_WRITE_TOKEN ortam değişkeni gerekli.",
    );
    console.error(error instanceof Error ? error.message : error);
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
