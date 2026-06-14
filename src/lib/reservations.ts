import { prisma } from "@/lib/prisma";
import type { ReservationStatus } from "@prisma/client";
import { startOfDay } from "date-fns";

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
        status: { not: "iptal" },
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

export function getTrackingUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/takip/${slug}`;
}

export function formatCoupleName(brideName: string, groomName: string) {
  const bride = brideName.trim();
  const groom = groomName.trim();
  if (bride && groom) return `${bride} & ${groom}`;
  return bride || groom || "Rezervasyon";
}
