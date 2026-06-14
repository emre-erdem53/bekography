import type { ReservationStatus } from "@prisma/client";

export const RESERVATION_DELIVERED_CONFIRM =
  "Bu rezervasyonu teslim edildi olarak işaretlediğinizde tamamlandı olarak müşteri bilgilendirilecektir. Onaylıyor musunuz?";

export const RESERVATION_CANCEL_CONFIRM =
  "Bu rezervasyonu iptal ettiğinizde kayıt kalıcı olarak silinecektir. Onaylıyor musunuz?";

export type ReservationStatusChangeResult =
  | { kind: "updated"; status: ReservationStatus }
  | { kind: "delivered" }
  | { kind: "deleted" };

export async function changeReservationStatus(
  id: string,
  nextStatus: ReservationStatus,
  currentStatus: ReservationStatus,
): Promise<ReservationStatusChangeResult | null> {
  if (nextStatus === currentStatus) return null;

  if (nextStatus === "teslim_edildi") {
    if (!window.confirm(RESERVATION_DELIVERED_CONFIRM)) return null;

    const response = await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "teslim_edildi" }),
    });

    if (!response.ok) {
      const data = await response.json();
      window.alert(data.error ?? "Durum güncellenemedi");
      return null;
    }

    return { kind: "delivered" };
  }

  if (nextStatus === "iptal") {
    if (!window.confirm(RESERVATION_CANCEL_CONFIRM)) return null;

    const response = await fetch(`/api/admin/reservations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      window.alert(data.error ?? "Rezervasyon silinemedi");
      return null;
    }

    return { kind: "deleted" };
  }

  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });

  if (!response.ok) {
    const data = await response.json();
    window.alert(data.error ?? "Durum güncellenemedi");
    return null;
  }

  return { kind: "updated", status: nextStatus };
}
