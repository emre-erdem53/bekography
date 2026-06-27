import type { ReservationStatus } from "@prisma/client";

export const RESERVATION_DELIVERED_CONFIRM =
  "Bu rezervasyonu teslim edildi olarak işaretlediğinizde tamamlandı olarak müşteri bilgilendirilecektir. Onaylıyor musunuz?";

export const RESERVATION_DELETE_CONFIRM =
  "Bu rezervasyonu silmek istediğinize emin misiniz? Silinen rezervasyon listede kalır ve istediğiniz zaman geri getirilebilir.";

export const RESERVATION_RESTORE_CONFIRM =
  "Bu rezervasyonu geri getirmek istediğinize emin misiniz?";

export type ReservationStatusChangeResult =
  | { kind: "updated"; status: ReservationStatus }
  | { kind: "delivered" }
  | { kind: "deleted" };

export async function deleteReservation(id: string): Promise<boolean> {
  if (!window.confirm(RESERVATION_DELETE_CONFIRM)) return false;

  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    window.alert(data.error ?? "Rezervasyon silinemedi");
    return false;
  }

  return true;
}

export async function restoreReservation(id: string): Promise<boolean> {
  if (!window.confirm(RESERVATION_RESTORE_CONFIRM)) return false;

  const response = await fetch(`/api/admin/reservations/${id}/restore`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json();
    window.alert(data.error ?? "Rezervasyon geri getirilemedi");
    return false;
  }

  return true;
}

export async function completeReservation(
  id: string,
): Promise<ReservationStatusChangeResult | null> {
  if (!window.confirm(RESERVATION_DELIVERED_CONFIRM)) return null;

  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "teslim_edildi" }),
  });

  if (!response.ok) {
    const data = await response.json();
    window.alert(data.error ?? "Rezervasyon tamamlanamadı");
    return null;
  }

  return { kind: "delivered" };
}

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
