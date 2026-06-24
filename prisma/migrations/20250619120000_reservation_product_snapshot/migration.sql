-- AlterTable
ALTER TABLE "ReservationItem" ADD COLUMN "productSnapshot" JSONB NOT NULL DEFAULT '{}';
