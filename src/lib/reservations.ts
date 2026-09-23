import { prisma } from "@/lib/prisma";
import type { ReservationStatus } from "@prisma/client";
import { parseDateOnlyInput, toDateInputValue } from "@/lib/date-only";
import { formatCoupleName } from "@/lib/reservation-utils";
import { isOutdoorScheduleType } from "@/lib/post-shoot";

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

const ACTIVE_RESERVATION_STATUSES_EXCLUDED: ReservationStatus[] = [
  "taslak",
  "iptal",
  "teslim_edildi",
];

export type ShootDateConflictItemSummary = {
  serviceAreaTitle: string;
  packageTitle: string;
  shootTypeLabel: string;
  isOutdoor: boolean;
  departureTime: string | null;
  arrivalTime: string | null;
  startTime: string | null;
  endTime: string | null;
};

export type ShootDateConflictReservation = {
  reservationId: string;
  coupleName: string;
  status: ReservationStatus;
  items: ShootDateConflictItemSummary[];
};

export type ShootDateConflict = {
  date: string;
  reservations: ShootDateConflictReservation[];
};

function formatTimeRange(item: ShootDateConflictItemSummary): string {
  if (item.isOutdoor) {
    const from = item.departureTime?.trim();
    const to = item.arrivalTime?.trim();
    if (from && to) return `${from}–${to}`;
    if (from) return `Çıkış ${from}`;
    if (to) return `Varış ${to}`;
    return "";
  }
  const from = item.startTime?.trim();
  const to = item.endTime?.trim();
  if (from && to) return `${from}–${to}`;
  if (from) return `Başlangıç ${from}`;
  if (to) return `Bitiş ${to}`;
  return "";
}

export function formatShootDateConflictSummary(
  conflicts: ShootDateConflict[],
): string {
  return conflicts
    .map((conflict) => {
      const reservationLines = conflict.reservations.map((reservation) => {
        const itemLines = reservation.items.map((item) => {
          const title = [item.serviceAreaTitle, item.packageTitle, item.shootTypeLabel]
            .filter(Boolean)
            .join(" · ");
          const time = formatTimeRange(item);
          return time ? `  • ${title} (${time})` : `  • ${title}`;
        });
        return [`${reservation.coupleName}`, ...itemLines].join("\n");
      });
      return [`${conflict.date}`, ...reservationLines].join("\n");
    })
    .join("\n\n");
}

export async function findShootDateConflictDetails(
  shootDates: (Date | string)[],
  excludeReservationId?: string,
): Promise<ShootDateConflict[]> {
  const uniqueDates = [
    ...new Set(
      shootDates.map((shootDate) =>
        toDateInputValue(normalizeShootDateInput(shootDate)),
      ),
    ),
  ];

  const conflicts: ShootDateConflict[] = [];

  for (const date of uniqueDates) {
    const items = await prisma.reservationItem.findMany({
      where: {
        shootDate: parseDateOnlyInput(date),
        reservation: {
          status: { notIn: ACTIVE_RESERVATION_STATUSES_EXCLUDED },
          deletedAt: null,
          ...(excludeReservationId
            ? { id: { not: excludeReservationId } }
            : {}),
        },
      },
      include: {
        reservation: {
          select: {
            id: true,
            status: true,
            brideName: true,
            groomName: true,
          },
        },
        shootType: {
          include: {
            package: {
              include: { serviceArea: true },
            },
          },
        },
      },
      orderBy: [{ departureTime: "asc" }, { startTime: "asc" }],
    });

    if (items.length === 0) continue;

    const byReservation = new Map<string, ShootDateConflictReservation>();

    for (const item of items) {
      const reservationId = item.reservation.id;
      let entry = byReservation.get(reservationId);
      if (!entry) {
        entry = {
          reservationId,
          coupleName: formatCoupleName(
            item.reservation.brideName,
            item.reservation.groomName,
          ),
          status: item.reservation.status,
          items: [],
        };
        byReservation.set(reservationId, entry);
      }

      entry.items.push({
        serviceAreaTitle: item.shootType.package.serviceArea.title,
        packageTitle: item.shootType.package.title,
        shootTypeLabel: item.shootType.label,
        isOutdoor: isOutdoorScheduleType(
          item.shootType.package.serviceArea.scheduleType,
        ),
        departureTime: item.departureTime,
        arrivalTime: item.arrivalTime,
        startTime: item.startTime,
        endTime: item.endTime,
      });
    }

    conflicts.push({
      date,
      reservations: [...byReservation.values()],
    });
  }

  return conflicts;
}

/** @deprecated Prefer findShootDateConflictDetails — kept for simple date lists. */
export async function findShootDateConflicts(
  shootDates: (Date | string)[],
  excludeReservationId?: string,
) {
  const details = await findShootDateConflictDetails(
    shootDates,
    excludeReservationId,
  );
  return details.map((conflict) => conflict.date);
}

export async function isShootDateTaken(
  shootDate: Date | string,
  excludeReservationId?: string,
) {
  const conflicts = await findShootDateConflictDetails(
    [shootDate],
    excludeReservationId,
  );
  return conflicts.length > 0;
}

export async function addReservationStatusHistory(
  reservationId: string,
  status: ReservationStatus,
) {
  await prisma.reservationStatusHistory.create({
    data: { reservationId, status },
  });
}
