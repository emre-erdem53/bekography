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

export type ShootDateConflictKind = "time_overlap" | "same_day";

export type ShootDateConflict = {
  date: string;
  kind: ShootDateConflictKind;
  reservations: ShootDateConflictReservation[];
};

export type ProposedScheduleItem = {
  shootDate: string;
  isOutdoor?: boolean;
  departureTime?: string | null;
  arrivalTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type ScheduleConflictEvaluation = {
  timeOverlaps: ShootDateConflict[];
  sameDayOnly: ShootDateConflict[];
};

/** "HH:MM" veya "HH:MM:SS" → dakika. Geçersizse null. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  const raw = value?.trim();
  if (!raw) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

export type TimeRange = { start: number; end: number };

export function resolveItemTimeRange(item: {
  isOutdoor?: boolean;
  departureTime?: string | null;
  arrivalTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): TimeRange | null {
  const start = parseTimeToMinutes(
    item.isOutdoor ? item.departureTime : item.startTime,
  );
  const end = parseTimeToMinutes(
    item.isOutdoor ? item.arrivalTime : item.endTime,
  );
  if (start === null || end === null) return null;
  if (end <= start) return null;
  return { start, end };
}

/** Uçlar birbirine değiyorsa (14:00–16:00 ve 16:00–18:00) çakışma sayılmaz. */
export function timeRangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

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
          const title = [
            item.serviceAreaTitle,
            item.packageTitle,
            item.shootTypeLabel,
          ]
            .filter(Boolean)
            .join(" · ");
          const time = formatTimeRange(item);
          return time ? `  • ${title} (${time})` : `  • ${title}`;
        });
        return [`${reservation.coupleName}`, ...itemLines].join("\n");
      });
      const prefix =
        conflict.kind === "time_overlap"
          ? `${conflict.date} — saat çakışması`
          : conflict.date;
      return [`${prefix}`, ...reservationLines].join("\n");
    })
    .join("\n\n");
}

function toConflictItemSummary(item: {
  departureTime: string | null;
  arrivalTime: string | null;
  startTime: string | null;
  endTime: string | null;
  shootType: {
    label: string;
    package: {
      title: string;
      serviceArea: { title: string; scheduleType: string };
    };
  };
}): ShootDateConflictItemSummary {
  return {
    serviceAreaTitle: item.shootType.package.serviceArea.title,
    packageTitle: item.shootType.package.title,
    shootTypeLabel: item.shootType.label,
    isOutdoor: isOutdoorScheduleType(
      item.shootType.package.serviceArea.scheduleType as "outdoor" | "indoor",
    ),
    departureTime: item.departureTime,
    arrivalTime: item.arrivalTime,
    startTime: item.startTime,
    endTime: item.endTime,
  };
}

async function loadExistingItemsForDates(
  dates: string[],
  excludeReservationId?: string,
) {
  if (dates.length === 0) return [];

  return prisma.reservationItem.findMany({
    where: {
      shootDate: { in: dates.map((date) => parseDateOnlyInput(date)) },
      reservation: {
        status: { notIn: ACTIVE_RESERVATION_STATUSES_EXCLUDED },
        deletedAt: null,
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
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
}

function groupItemsByReservation(
  items: Awaited<ReturnType<typeof loadExistingItemsForDates>>,
): ShootDateConflictReservation[] {
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
    entry.items.push(toConflictItemSummary(item));
  }

  return [...byReservation.values()];
}

/**
 * Aynı gün mevcut rezervasyonları getirir (saat sınıflandırması yok).
 * Form uyarısı / geriye uyumluluk için.
 */
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

  const existing = await loadExistingItemsForDates(
    uniqueDates,
    excludeReservationId,
  );
  if (existing.length === 0) return [];

  const byDate = new Map<string, typeof existing>();
  for (const item of existing) {
    const date = toDateInputValue(item.shootDate);
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
  }

  return [...byDate.entries()].map(([date, items]) => ({
    date,
    kind: "same_day" as const,
    reservations: groupItemsByReservation(items),
  }));
}

/**
 * Önerilen kalemlerin saatleriyle mevcut randevuları karşılaştırır.
 * - timeOverlaps: kesin engel (çakışan saat)
 * - sameDayOnly: uyarı + onay ile izin (aynı gün, farklı / belirsiz saat)
 */
export async function evaluateReservationScheduleConflicts(
  proposedItems: ProposedScheduleItem[],
  excludeReservationId?: string,
): Promise<ScheduleConflictEvaluation> {
  const uniqueDates = [
    ...new Set(
      proposedItems
        .map((item) => item.shootDate)
        .filter(Boolean)
        .map((shootDate) =>
          toDateInputValue(normalizeShootDateInput(shootDate)),
        ),
    ),
  ];

  const existing = await loadExistingItemsForDates(
    uniqueDates,
    excludeReservationId,
  );

  const existingByDate = new Map<string, typeof existing>();
  for (const item of existing) {
    const date = toDateInputValue(item.shootDate);
    const list = existingByDate.get(date) ?? [];
    list.push(item);
    existingByDate.set(date, list);
  }

  const timeOverlaps: ShootDateConflict[] = [];
  const sameDayOnly: ShootDateConflict[] = [];

  for (const date of uniqueDates) {
    const dayExisting = existingByDate.get(date) ?? [];
    if (dayExisting.length === 0) continue;

    const proposedForDay = proposedItems.filter(
      (item) =>
        toDateInputValue(normalizeShootDateInput(item.shootDate)) === date,
    );

    const overlappingExisting = dayExisting.filter((existingItem) => {
      const existingRange = resolveItemTimeRange(
        toConflictItemSummary(existingItem),
      );
      if (!existingRange) return false;

      return proposedForDay.some((proposed) => {
        const proposedRange = resolveItemTimeRange({
          isOutdoor: proposed.isOutdoor,
          departureTime: proposed.departureTime,
          arrivalTime: proposed.arrivalTime,
          startTime: proposed.startTime,
          endTime: proposed.endTime,
        });
        if (!proposedRange) return false;
        return timeRangesOverlap(existingRange, proposedRange);
      });
    });

    const proposedMissingTimes = proposedForDay.some(
      (proposed) =>
        resolveItemTimeRange({
          isOutdoor: proposed.isOutdoor,
          departureTime: proposed.departureTime,
          arrivalTime: proposed.arrivalTime,
          startTime: proposed.startTime,
          endTime: proposed.endTime,
        }) === null,
    );

    const reservations = groupItemsByReservation(dayExisting);

    if (overlappingExisting.length > 0 || proposedMissingTimes) {
      timeOverlaps.push({
        date,
        kind: "time_overlap",
        reservations:
          overlappingExisting.length > 0
            ? groupItemsByReservation(overlappingExisting)
            : reservations,
      });
    } else {
      sameDayOnly.push({
        date,
        kind: "same_day",
        reservations,
      });
    }
  }

  return { timeOverlaps, sameDayOnly };
}

export async function buildProposedScheduleItemsFromReservationItems(
  items: Array<{
    shootTypeId: string;
    shootDate: string;
    departureTime?: string | null;
    arrivalTime?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  }>,
): Promise<ProposedScheduleItem[]> {
  const shootTypeIds = [...new Set(items.map((item) => item.shootTypeId))];
  const shootTypes = await prisma.shootType.findMany({
    where: { id: { in: shootTypeIds } },
    include: { package: { include: { serviceArea: true } } },
  });
  const byId = new Map(shootTypes.map((shootType) => [shootType.id, shootType]));

  return items.map((item) => {
    const shootType = byId.get(item.shootTypeId);
    const isOutdoor = isOutdoorScheduleType(
      shootType?.package.serviceArea.scheduleType,
    );
    return {
      shootDate: item.shootDate,
      isOutdoor,
      departureTime: isOutdoor ? item.departureTime ?? null : null,
      arrivalTime: isOutdoor ? item.arrivalTime ?? null : null,
      startTime: isOutdoor ? null : item.startTime ?? null,
      endTime: isOutdoor ? null : item.endTime ?? null,
    };
  });
}

/** @deprecated Prefer findShootDateConflictDetails / evaluateReservationScheduleConflicts */
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
