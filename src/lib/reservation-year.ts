import { ReservationStatus } from "@prisma/client";

export const INACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  "taslak",
  "iptal",
  "teslim_edildi",
];

export function getCurrentReservationYear(): number {
  return new Date().getFullYear();
}

export function parseReservationYearParam(value: string | null): number | null {
  if (!value) return null;
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}

/** Rezervasyonun yılı: en erken çekim tarihi. */
export function getReservationYearFromShootDates(
  shootDates: Array<string | Date>,
): number | null {
  if (shootDates.length === 0) return null;

  const earliest = shootDates.reduce((min, value) => {
    const time = new Date(value).getTime();
    return time < min ? time : min;
  }, new Date(shootDates[0]).getTime());

  return new Date(earliest).getUTCFullYear();
}

export function reservationCountsForYear(
  rows: Array<{ year: number; status: ReservationStatus }>,
  year: number,
): number {
  return rows.filter((row) => row.year === year).length;
}

export function buildYearOptions(
  rows: Array<{ year: number; status: ReservationStatus }>,
  currentYear = getCurrentReservationYear(),
): Array<{ year: number; count: number }> {
  const years = new Set(rows.map((row) => row.year));
  years.add(currentYear);

  return [...years]
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      count: reservationCountsForYear(rows, year),
    }));
}
