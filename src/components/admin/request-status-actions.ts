export const REQUEST_DELETE_CONFIRM =
  "Bu talebi silmek istediğinize emin misiniz? Silinen talep listede kalır ve istediğiniz zaman geri getirilebilir.";

export const REQUEST_RESTORE_CONFIRM =
  "Bu talebi geri getirmek istediğinize emin misiniz?";

export async function deleteRequest(id: string): Promise<boolean> {
  if (!window.confirm(REQUEST_DELETE_CONFIRM)) return false;

  const response = await fetch(`/api/admin/requests/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    window.alert(data.error ?? "Talep silinemedi");
    return false;
  }

  return true;
}

export async function restoreRequest(id: string): Promise<boolean> {
  if (!window.confirm(REQUEST_RESTORE_CONFIRM)) return false;

  const response = await fetch(`/api/admin/requests/${id}/restore`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json();
    window.alert(data.error ?? "Talep geri getirilemedi");
    return false;
  }

  return true;
}
