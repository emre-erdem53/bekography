-- Request: iletişim ad/soyad ve rol
ALTER TABLE "Request" ADD COLUMN "contactFirstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Request" ADD COLUMN "contactLastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Request" ADD COLUMN "contactRole" TEXT;

UPDATE "Request"
SET
  "contactFirstName" = COALESCE(NULLIF(split_part(trim(regexp_replace("customerName", '\s*\((Gelin|Damat)\)\s*$', '')), ' ', 1), ''), trim("customerName")),
  "contactLastName" = CASE
    WHEN strpos(trim(regexp_replace("customerName", '\s*\((Gelin|Damat)\)\s*$', '')), ' ') > 0
    THEN trim(substring(trim(regexp_replace("customerName", '\s*\((Gelin|Damat)\)\s*$', '')) FROM strpos(trim(regexp_replace("customerName", '\s*\((Gelin|Damat)\)\s*$', '')), ' ') + 1))
    ELSE ''
  END,
  "contactRole" = CASE
    WHEN "customerName" ~ '\(Gelin\)\s*$' THEN 'gelin'
    WHEN "customerName" ~ '\(Damat\)\s*$' THEN 'damat'
    ELSE NULL
  END;

-- Reservation: gelin/damat ad soyad
ALTER TABLE "Reservation" ADD COLUMN "brideFirstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Reservation" ADD COLUMN "brideLastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Reservation" ADD COLUMN "groomFirstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Reservation" ADD COLUMN "groomLastName" TEXT NOT NULL DEFAULT '';

UPDATE "Reservation"
SET
  "brideFirstName" = COALESCE(NULLIF(split_part(trim("brideName"), ' ', 1), ''), trim("brideName")),
  "brideLastName" = CASE
    WHEN strpos(trim("brideName"), ' ') > 0
    THEN trim(substring(trim("brideName") FROM strpos(trim("brideName"), ' ') + 1))
    ELSE ''
  END,
  "groomFirstName" = COALESCE(NULLIF(split_part(trim("groomName"), ' ', 1), ''), trim("groomName")),
  "groomLastName" = CASE
    WHEN strpos(trim("groomName"), ' ') > 0
    THEN trim(substring(trim("groomName") FROM strpos(trim("groomName"), ' ') + 1))
    ELSE ''
  END;
