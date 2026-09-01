-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('indoor', 'outdoor');

-- Rename PackageCategory -> ServiceArea (RENAME preserves rows and foreign keys)
ALTER TABLE "PackageCategory" RENAME TO "ServiceArea";
ALTER TABLE "ServiceArea" RENAME CONSTRAINT "PackageCategory_pkey" TO "ServiceArea_pkey";
ALTER INDEX "PackageCategory_slug_key" RENAME TO "ServiceArea_slug_key";

-- Rename PackageOption -> ShootType
ALTER TABLE "PackageOption" RENAME TO "ShootType";
ALTER TABLE "ShootType" RENAME CONSTRAINT "PackageOption_pkey" TO "ShootType_pkey";
ALTER TABLE "ShootType" RENAME CONSTRAINT "PackageOption_categoryId_fkey" TO "ShootType_categoryId_fkey";
ALTER INDEX "PackageOption_categoryId_idx" RENAME TO "ShootType_categoryId_idx";

-- RequestItem.packageOptionId -> shootTypeId
ALTER TABLE "RequestItem" RENAME COLUMN "packageOptionId" TO "shootTypeId";
ALTER TABLE "RequestItem" RENAME CONSTRAINT "RequestItem_packageOptionId_fkey" TO "RequestItem_shootTypeId_fkey";

-- ReservationItem.packageOptionId -> shootTypeId
ALTER TABLE "ReservationItem" RENAME COLUMN "packageOptionId" TO "shootTypeId";
ALTER TABLE "ReservationItem" RENAME CONSTRAINT "ReservationItem_packageOptionId_fkey" TO "ReservationItem_shootTypeId_fkey";

-- AlterTable: ServiceArea gains hierarchy metadata
ALTER TABLE "ServiceArea" ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL DEFAULT 'indoor',
ADD COLUMN     "isCompanionOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill scheduleType from the legacy content flag, falling back to the hard-coded outdoor slug
UPDATE "ServiceArea"
SET "scheduleType" = 'outdoor'
WHERE "content" ->> 'scheduleType' = 'outdoor'
   OR "slug" = 'dis-cekim';

-- Backfill isCompanionOnly from the previously hard-coded companion slug list
UPDATE "ServiceArea"
SET "isCompanionOnly" = true
WHERE "slug" IN ('gelin-cikisi', 'kuafor');

-- Backfill service area tags from the legacy category-level highlightTags array (max 5)
UPDATE "ServiceArea"
SET "tags" = COALESCE(
  (
    SELECT ARRAY_AGG(tag)
    FROM (
      SELECT tag
      FROM jsonb_array_elements_text("content" -> 'highlightTags') AS tag
      LIMIT 5
    ) AS limited
  ),
  ARRAY[]::TEXT[]
)
WHERE jsonb_typeof("content" -> 'highlightTags') = 'array';

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "iconKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Package_serviceAreaId_idx" ON "Package"("serviceAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_serviceAreaId_slug_key" ON "Package"("serviceAreaId", "slug");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: give every service area one default package so existing shoot types keep a parent
INSERT INTO "Package" ("id", "serviceAreaId", "slug", "title", "sortOrder", "isActive", "tags", "createdAt", "updatedAt")
SELECT
    'pkg-' || sa."id",
    sa."id",
    'standart',
    sa."title",
    0,
    true,
    ARRAY[]::TEXT[],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ServiceArea" sa;

-- AlterTable: ShootType.categoryId -> packageId
ALTER TABLE "ShootType" ADD COLUMN "packageId" TEXT;

UPDATE "ShootType" st
SET "packageId" = p."id"
FROM "Package" p
WHERE p."serviceAreaId" = st."categoryId";

ALTER TABLE "ShootType" ALTER COLUMN "packageId" SET NOT NULL;

ALTER TABLE "ShootType" DROP CONSTRAINT "ShootType_categoryId_fkey";
DROP INDEX "ShootType_categoryId_idx";
ALTER TABLE "ShootType" DROP COLUMN "categoryId";

-- AlterTable: ShootType gains its own content and metadata
ALTER TABLE "ShootType" ADD COLUMN     "iconKey" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "content" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "ShootType_packageId_idx" ON "ShootType"("packageId");

-- AddForeignKey
ALTER TABLE "ShootType" ADD CONSTRAINT "ShootType_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
