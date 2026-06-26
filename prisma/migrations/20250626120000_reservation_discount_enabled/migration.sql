-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "discountEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Mevcut indirimli kayıtları aktif say
UPDATE "Reservation" SET "discountEnabled" = true WHERE "discountAmount" > 0;
