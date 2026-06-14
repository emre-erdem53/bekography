import type { RequestStatus, ReservationStatus } from "@prisma/client";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  yeni: "Yeni",
  teklif_verildi: "Teklif Verildi",
  onaylandi: "Onaylandı",
  iptal: "İptal",
};

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
  pesin: "Peşin",
  taksitli: "Taksitli",
} as const;

export const WHATSAPP_NUMBER =
  process.env.WHATSAPP_NUMBER ?? "905469370464";

export function formatPrice(amount: number) {
  return `₺${amount.toLocaleString("tr-TR")}`;
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
