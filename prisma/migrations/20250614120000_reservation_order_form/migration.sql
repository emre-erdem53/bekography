-- Reservation: add new columns first
ALTER TABLE "Reservation" ADD COLUMN "brideName" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "brideTc" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Reservation" ADD COLUMN "bridePhone" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "groomName" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "groomTc" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Reservation" ADD COLUMN "groomPhone" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "totalPrice" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "cancellationFeeMax" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Reservation" ADD COLUMN "postShoot" JSONB NOT NULL DEFAULT '{}';

UPDATE "Reservation"
SET
  "groomName" = COALESCE("customerName", ''),
  "groomPhone" = COALESCE("customerPhone", ''),
  "brideName" = '',
  "bridePhone" = COALESCE("customerPhone", ''),
  "totalPrice" = COALESCE("agreedPrice", 0);

ALTER TABLE "Reservation" ALTER COLUMN "brideName" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "bridePhone" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "groomName" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "groomPhone" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "totalPrice" SET NOT NULL;

-- ReservationItem: add per-package shoot details (before dropping Reservation.shootDate)
ALTER TABLE "ReservationItem" ADD COLUMN "shootDate" DATE;
ALTER TABLE "ReservationItem" ADD COLUMN "shootContent" TEXT;
ALTER TABLE "ReservationItem" ADD COLUMN "readyTime" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ReservationItem" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ReservationItem" ADD COLUMN "agreedUnitPrice" INTEGER;
ALTER TABLE "ReservationItem" ADD COLUMN "departureTime" TEXT;
ALTER TABLE "ReservationItem" ADD COLUMN "arrivalTime" TEXT;
ALTER TABLE "ReservationItem" ADD COLUMN "startTime" TEXT;
ALTER TABLE "ReservationItem" ADD COLUMN "endTime" TEXT;

UPDATE "ReservationItem" ri
SET
  "shootDate" = COALESCE(
    (SELECT r."shootDate" FROM "Reservation" r WHERE r.id = ri."reservationId"),
    CURRENT_DATE
  ),
  "shootContent" = COALESCE(
    (SELECT po.label FROM "PackageOption" po WHERE po.id = ri."packageOptionId"),
    ''
  ),
  "agreedUnitPrice" = COALESCE(ri."unitPrice", 0);

ALTER TABLE "ReservationItem" ALTER COLUMN "shootDate" SET NOT NULL;
ALTER TABLE "ReservationItem" ALTER COLUMN "shootContent" SET NOT NULL;
ALTER TABLE "ReservationItem" ALTER COLUMN "agreedUnitPrice" SET NOT NULL;

CREATE INDEX "ReservationItem_shootDate_idx" ON "ReservationItem"("shootDate");

-- Drop legacy reservation columns
ALTER TABLE "Reservation" DROP COLUMN "customerName";
ALTER TABLE "Reservation" DROP COLUMN "customerPhone";
ALTER TABLE "Reservation" DROP COLUMN "city";
ALTER TABLE "Reservation" DROP COLUMN "shootDate";
ALTER TABLE "Reservation" DROP COLUMN "agreedPrice";

DROP INDEX IF EXISTS "Reservation_shootDate_idx";

-- Payment installments
CREATE TABLE "ReservationPaymentInstallment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReservationPaymentInstallment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReservationPaymentInstallment_reservationId_idx" ON "ReservationPaymentInstallment"("reservationId");

ALTER TABLE "ReservationPaymentInstallment" ADD CONSTRAINT "ReservationPaymentInstallment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
