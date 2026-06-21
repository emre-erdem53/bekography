import { prisma } from "@/lib/prisma";
import type { ReservationStatus } from "@prisma/client";
import { startOfDay } from "date-fns";

export {
  formatCoupleName,
  getTrackingUrl,
  normalizeTcKimlik,
  reservationTcMatches,
} from "@/lib/reservation-utils";

export async function isShootDateTaken(
  shootDate: Date | string,
  excludeReservationId?: string,
) {
  const date = startOfDay(
    typeof shootDate === "string" ? new Date(shootDate) : shootDate,
  );

  const existing = await prisma.reservationItem.findFirst({
    where: {
      shootDate: date,
      reservation: {
        status: { notIn: ["iptal", "teslim_edildi"] },
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
      const date = startOfDay(
        typeof shootDate === "string" ? new Date(shootDate) : shootDate,
      );
      conflicts.push(date.toISOString().split("T")[0]);
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
