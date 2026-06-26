import { addDays, endOfDay, isAfter } from "date-fns";
import type { ReservationStatus } from "@prisma/client";

export const TRACKING_LINK_ACTIVE_DAYS = 30;

export function getTrackingLinkExpiresAt(
  completedAt: Date | null | undefined,
): Date | null {
  if (!completedAt) return null;
  return endOfDay(addDays(completedAt, TRACKING_LINK_ACTIVE_DAYS));
}

export function isTrackingLinkExpired(
  completedAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  const expiresAt = getTrackingLinkExpiresAt(completedAt);
  if (!expiresAt) return false;
  return isAfter(now, expiresAt);
}

type ReservationCompletionSource = {
  status: ReservationStatus;
  completedAt: Date | null;
  statusHistory?: { status: ReservationStatus; changedAt: Date }[];
};

export function resolveReservationCompletedAt(
  reservation: ReservationCompletionSource,
): Date | null {
  if (reservation.completedAt) return reservation.completedAt;

  if (reservation.status !== "teslim_edildi") return null;

  const deliveredEntry = [...(reservation.statusHistory ?? [])]
    .reverse()
    .find((entry) => entry.status === "teslim_edildi");

  return deliveredEntry?.changedAt ?? null;
}

export function isReservationTrackingAccessible(
  reservation: ReservationCompletionSource,
  now: Date = new Date(),
): boolean {
  if (reservation.status === "iptal") return false;
  const completedAt = resolveReservationCompletedAt(reservation);
  if (!completedAt) return true;
  return !isTrackingLinkExpired(completedAt, now);
}
