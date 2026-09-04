-- AlterEnum
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'taslak';

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "draftPayload" JSONB;
