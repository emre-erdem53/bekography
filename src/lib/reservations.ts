import { prisma } from "@/lib/prisma";
import type { ReservationStatus } from "@prisma/client";
import { parseDateOnlyInput, toDateInputValue } from "@/lib/date-only";

export {
  formatCoupleName,
  getTrackingUrl,
  normalizeTcKimlik,
  reservationTcMatches,
} from "@/lib/reservation-utils";

function normalizeShootDateInput(shootDate: Date | string): Date {
  if (typeof shootDate === "string") {
    return parseDateOnlyInput(shootDate);
  }
  return parseDateOnlyInput(toDateInputValue(shootDate));
}

export async function isShootDateTaken(
  shootDate: Date | string,
  excludeReservationId?: string,
) {
  const date = normalizeShootDateInput(shootDate);

  const existing = await prisma.reservationItem.findFirst({
    where: {
      shootDate: date,
      reservation: {
        status: { notIn: ["iptal", "teslim_edildi"] },
        deletedAt: null,
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
    },
  });

  return !!existing;
}

export async function findShootDateConflicts(
  shootDates: (Date | string)[],
  excludeReservationId?: string,
) {
  const conflicts: string[] = [];

  for (const shootDate of shootDates) {
    if (await isShootDateTaken(shootDate, excludeReservationId)) {
      conflicts.push(toDateInputValue(normalizeShootDateInput(shootDate)));
    }
  }

  return conflicts;
}

export async function addReservationStatusHistory(
  reservationId: string,
  status: ReservationStatus,
) {
  await prisma.reservationStatusHistory.create({
    data: { reservationId, status },
  });
}
