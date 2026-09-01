-- AlterTable: Package gains optional accent color (falls back to ServiceArea.accentColor)
ALTER TABLE "Package" ADD COLUMN "accentColor" TEXT;

-- Backfill from parent service area so existing packages keep a visible color
UPDATE "Package" AS p
SET "accentColor" = s."accentColor"
FROM "ServiceArea" AS s
WHERE p."serviceAreaId" = s."id"
  AND p."accentColor" IS NULL;
