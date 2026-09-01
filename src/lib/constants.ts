import type { RequestStatus, ReservationStatus } from "@prisma/client";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  yeni: "Yeni",
  teklif_verildi: "Teklif Verildi",
  onaylandi: "Onaylandı",
  iptal: "İptal",
};

export const OUTDOOR_DEFAULT_DEPARTURE_TIME = "13:00";
export const OUTDOOR_DEFAULT_ARRIVAL_TIME = "17:00";
export const RESERVATION_RESTORE_DAYS = 30;

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  planlandi: "Planlandı",
  cekim_yapildi: "Çekim Yapıldı",
  montaj_yapiliyor: "Montaj Yapılıyor",
  album_onaylandi: "Albüm Onaylandı",
  album_siparisi_verildi: "Albüm Siparişi Verildi",
  album_kargoda: "Albüm Kargoda",
  teslim_edildi: "Teslim Edildi",
  iptal: "İptal",
};

export const RESERVATION_STATUS_ORDER: ReservationStatus[] = [
  "planlandi",
  "cekim_yapildi",
  "montaj_yapiliyor",
  "album_onaylandi",
  "album_siparisi_verildi",
  "album_kargoda",
  "teslim_edildi",
];

export const PAYMENT_TYPE_LABELS = {
  pesin: "Peşin İndirimli",
  taksitli: "3 Taksitli",
} as const;

export type PaymentType = keyof typeof PAYMENT_TYPE_LABELS;

export const PAYMENT_TYPE_DESCRIPTIONS: Record<PaymentType, string> = {
  pesin: "Rezervasyondan önce tümü ödenir.",
  taksitli: "3 ayda tamamlanır.",
};

export const WHATSAPP_NUMBER =
  process.env.WHATSAPP_NUMBER ?? "905469370464";

export function formatPrice(amount: number) {
  return `₺${amount.toLocaleString("tr-TR")}`;
}

/** Taksit toplamından aylık dilim metni: "(14.000 TL x 3 Ay)" */
export function formatInstallmentBreakdown(
  total: number,
  months = 3,
): string {
  const monthly = Math.round(total / months);
  return `(${monthly.toLocaleString("tr-TR")} TL x ${months} Ay)`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
