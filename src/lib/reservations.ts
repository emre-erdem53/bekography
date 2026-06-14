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

  const existing = await prisma.reservation.findFirst({
    where: {
      shootDate: date,
      status: { not: "iptal" },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
  });

  return !!existing;
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
