import type { RequestStatus } from "@prisma/client";
import {
  getCurrentReservationYear,
  parseReservationYearParam,
} from "@/lib/reservation-year";

export { getCurrentReservationYear, parseReservationYearParam };

export const REQUEST_ADMIN_FILTER_STATUSES: RequestStatus[] = [
  "yeni",
  "teklif_verildi",
  "onaylandi",
  "iptal",
];

export function getRequestYearFromShootDate(shootDate: string | Date): number {
  return new Date(shootDate).getUTCFullYear();
}

export function buildRequestYearOptions(
  rows: Array<{ shootDate: string | Date }>,
  currentYear = getCurrentReservationYear(),
): Array<{ year: number; count: number }> {
  const counts = new Map<number, number>();

  for (const row of rows) {
    const year = getRequestYearFromShootDate(row.shootDate);
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  counts.set(currentYear, counts.get(currentYear) ?? 0);

  return [...counts.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, count]) => ({ year, count }));
}

export function matchesRequestNameQuery(
  customerName: string,
  query: string,
): boolean {
  const normalized = query.trim().toLocaleLowerCase("tr");
  if (!normalized) return true;
  return customerName.toLocaleLowerCase("tr").includes(normalized);
}

export function countRequestsByStatus<T extends { status: RequestStatus }>(
  requests: T[],
): Record<RequestStatus, number> {
  const counts = Object.fromEntries(
    REQUEST_ADMIN_FILTER_STATUSES.map((status) => [status, 0]),
  ) as Record<RequestStatus, number>;

  for (const request of requests) {
    counts[request.status] += 1;
  }

  return counts;
}

export function requestMatchesStatusFilter(
  request: { status: RequestStatus },
  statusFilter: RequestStatus | null,
): boolean {
  if (!statusFilter) return true;
  return request.status === statusFilter;
}
