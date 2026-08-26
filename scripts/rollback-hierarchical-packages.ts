/**
 * Acil production rollback: hiyerarşik şemayı eski PackageCategory /
 * PackageOption yapısına çevirir. Production (main) kodu bu tabloları bekler.
 *
 * 1) ShootType.content içindeki galeri/incele verisini ServiceArea.content
 *    *ByOption haritalarına geri yazar
 * 2) Tablo/kolon rename'lerini geri alır
 * 3) Prisma migration kaydını siler
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

type JsonMap = Record<string, unknown>;

function asObject(value: unknown): JsonMap {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as JsonMap) };
  }
  return {};
}

function setKeyed(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value) && value.length === 0) return;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) return;
  target[key] = value;
}

async function restoreCategoryContent() {
  const areas = await prisma.serviceArea.findMany({
    include: {
      packages: {
        include: { shootTypes: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  for (const area of areas) {
    const content = asObject(area.content);
    const galleryMediaByOption: Record<string, unknown> = {};
    const detailSectionsByOption: Record<string, unknown> = {};
    const inspectEnabledByOption: Record<string, unknown> = {};
    const workflowStagesByOption: Record<string, unknown> = {};
    const workflowStageTagsByOption: Record<string, unknown> = {};
    const optionIconKeys: Record<string, unknown> = {};
    const highlightTagsByOption: Record<string, unknown> = {};

    for (const pkg of area.packages) {
      for (const shootType of pkg.shootTypes) {
        const stContent = asObject(shootType.content);
        const keys = [shootType.id, shootType.label, shootType.label.trim()];
        for (const key of keys) {
          if (!key) continue;
          setKeyed(galleryMediaByOption, key, stContent.galleryMedia);
          setKeyed(detailSectionsByOption, key, stContent.detailSections);
          if (typeof stContent.inspectEnabled === "boolean") {
            inspectEnabledByOption[key] = stContent.inspectEnabled;
          }
          setKeyed(workflowStagesByOption, key, stContent.workflowStages);
          setKeyed(workflowStageTagsByOption, key, stContent.workflowStageTags);
          if (shootType.iconKey) optionIconKeys[key] = shootType.iconKey;
          if (shootType.tags?.length) highlightTagsByOption[key] = shootType.tags;
        }
      }
    }

    const next = {
      ...content,
      ...(Object.keys(galleryMediaByOption).length
        ? { galleryMediaByOption }
        : {}),
      ...(Object.keys(detailSectionsByOption).length
        ? { detailSectionsByOption }
        : {}),
      ...(Object.keys(inspectEnabledByOption).length
        ? { inspectEnabledByOption }
        : {}),
      ...(Object.keys(workflowStagesByOption).length
        ? { workflowStagesByOption }
        : {}),
      ...(Object.keys(workflowStageTagsByOption).length
        ? { workflowStageTagsByOption }
        : {}),
      ...(Object.keys(optionIconKeys).length ? { optionIconKeys } : {}),
      ...(Object.keys(highlightTagsByOption).length
        ? { highlightTagsByOption }
        : {}),
    };

    await prisma.serviceArea.update({
      where: { id: area.id },
      data: { content: next as Prisma.InputJsonValue },
    });
    console.log(`content restored: ${area.slug}`);
  }
}

async function reverseSchema() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShootType" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "ShootType" st
    SET "categoryId" = p."serviceAreaId"
    FROM "Package" p
    WHERE p."id" = st."packageId";
  `);

  const missing = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM "ShootType" WHERE "categoryId" IS NULL`,
  );
  if (Number(missing[0]?.count ?? 0) > 0) {
    throw new Error("ShootType.categoryId backfill left null rows; aborting.");
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShootType" ALTER COLUMN "categoryId" SET NOT NULL;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ShootType_categoryId_idx" ON "ShootType"("categoryId");
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShootType"
      ADD CONSTRAINT "ShootType_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "ServiceArea"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShootType" DROP CONSTRAINT "ShootType_packageId_fkey";
  `);
  await prisma.$executeRawUnsafe(`
    DROP INDEX IF EXISTS "ShootType_packageId_idx";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShootType" DROP COLUMN "packageId";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Package" DROP CONSTRAINT "Package_serviceAreaId_fkey";
  `);
  await prisma.$executeRawUnsafe(`
    DROP TABLE "Package";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "RequestItem" RENAME COLUMN "shootTypeId" TO "packageOptionId";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "RequestItem" RENAME CONSTRAINT "RequestItem_shootTypeId_fkey" TO "RequestItem_packageOptionId_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ReservationItem" RENAME COLUMN "shootTypeId" TO "packageOptionId";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ReservationItem" RENAME CONSTRAINT "ReservationItem_shootTypeId_fkey" TO "ReservationItem_packageOptionId_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ShootType" RENAME TO "PackageOption";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PackageOption" RENAME CONSTRAINT "ShootType_pkey" TO "PackageOption_pkey";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PackageOption" RENAME CONSTRAINT "ShootType_categoryId_fkey" TO "PackageOption_categoryId_fkey";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER INDEX "ShootType_categoryId_idx" RENAME TO "PackageOption_categoryId_idx";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ServiceArea" RENAME TO "PackageCategory";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PackageCategory" RENAME CONSTRAINT "ServiceArea_pkey" TO "PackageCategory_pkey";
  `);
  await prisma.$executeRawUnsafe(`
    ALTER INDEX "ServiceArea_slug_key" RENAME TO "PackageCategory_slug_key";
  `);

  await prisma.$executeRawUnsafe(`
    DELETE FROM "_prisma_migrations"
    WHERE migration_name = '20250825200000_hierarchical_packages';
  `);
}

async function verify() {
  const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public'
       AND table_name IN ('PackageCategory','PackageOption','ServiceArea','ShootType','Package')
     ORDER BY 1`,
  );
  const counts = await prisma.$queryRawUnsafe<Array<{ categories: bigint; options: bigint }>>(
    `SELECT
       (SELECT COUNT(*) FROM "PackageCategory") AS categories,
       (SELECT COUNT(*) FROM "PackageOption") AS options`,
  );
  console.log("tables after rollback:", tables);
  console.log("counts:", {
    categories: Number(counts[0]?.categories ?? 0),
    options: Number(counts[0]?.options ?? 0),
  });
}

async function main() {
  console.log("Restoring category content from shoot types...");
  await restoreCategoryContent();
  console.log("Reversing schema...");
  await reverseSchema();
  console.log("Verifying...");
  await verify();
  console.log("Rollback complete. Production main code can read PackageCategory again.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
