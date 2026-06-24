import type { ReservationStatus } from "@prisma/client";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
} from "@/lib/constants";

/** Aktif rezervasyon listesinde filtre kutucuklarında gösterilen aşamalar. */
export const RESERVATION_ADMIN_FILTER_STATUSES: ReservationStatus[] =
  RESERVATION_STATUS_ORDER.filter(
    (status) => status !== "teslim_edildi" && status !== "iptal",
  );

/** Admin panelinde iş akışına uygun kısa etiketler. */
export const RESERVATION_ADMIN_STATUS_LABELS: Record<
  ReservationStatus,
  string
> = {
  planlandi: "Çekim Yapılacak",
  cekim_yapildi: "Dijital Teslimat Bekleniyor",
  montaj_yapiliyor: "Seçim Yapılacak",
  album_onaylandi: "Albüm Onayı",
  album_siparisi_verildi: "Albüm Siparişi Verildi",
  album_kargoda: "Albüm Kargoda",
  teslim_edildi: RESERVATION_STATUS_LABELS.teslim_edildi,
  iptal: RESERVATION_STATUS_LABELS.iptal,
};

export function matchesReservationNameQuery(
  brideName: string,
  groomName: string,
  query: string,
): boolean {
  const normalized = query.trim().toLocaleLowerCase("tr");
  if (!normalized) return true;
  const haystack = `${brideName} ${groomName}`.toLocaleLowerCase("tr");
  return haystack.includes(normalized);
}

export function countReservationsByStatus<
  T extends { status: ReservationStatus },
>(reservations: T[]): Record<ReservationStatus, number> {
  const counts = Object.fromEntries(
    RESERVATION_ADMIN_FILTER_STATUSES.map((status) => [status, 0]),
  ) as Record<ReservationStatus, number>;

  for (const reservation of reservations) {
    if (counts[reservation.status] !== undefined) {
      counts[reservation.status] += 1;
    }
  }

  return counts;
}
