import type { ZodError } from "zod";

const PATH_LABELS: Record<string, string> = {
  installments: "Ödeme vadeleri",
  items: "Paketler",
  postShoot: "Süreç etiketleri",
  itemStageTags: "Paket aşama etiketleri",
  workflowStageTags: "Aşama etiketleri",
  pills: "Etiketler",
  dueDate: "Vade tarihi",
  amount: "Tutar",
  brideFirstName: "Gelin adı",
  brideLastName: "Gelin soyadı",
  groomFirstName: "Damat adı",
  groomLastName: "Damat soyadı",
  bridePhone: "Gelin telefonu",
  groomPhone: "Damat telefonu",
  totalPrice: "Toplam fiyat",
  shootDate: "Çekim tarihi",
  location: "Çekim yeri",
  digital: "Dijital teslimat",
  editing: "Düzenleme",
  printing: "Baskı",
  title: "Paket başlığı",
  packages: "Paketler",
  shootTypes: "Çekim türleri",
  shootTypeId: "Çekim türü",
  serviceAreaId: "Hizmet alanı",
  cashPrice: "Hemen ödeme tutarı",
  installmentPrice: "Parçalı ödeme tutarı",
  label: "Çekim türü adı",
  slug: "Bağlantı adresi",
  content: "İçerik",
  tags: "Etiketler",
  services: "Hizmetler",
  detailSections: "İncele bölümleri",
  galleryMedia: "Galeri",
  workflowStages: "Süreç aşamaları",
  requestFieldLabels: "Talep formu etiketleri",
  scheduleType: "Takvim tipi",
  iconKey: "İkon",
  accentColor: "Accent renk",
};

function labelForPath(path: PropertyKey[]): string {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    const segment = String(path[index]);
    if (PATH_LABELS[segment]) {
      return PATH_LABELS[segment];
    }
  }
  return "Form alanı";
}

function turkishInvalidTypeMessage(
  label: string,
  expected: string,
  received: string,
): string {
  if (expected === "array" && received === "undefined") {
    return `${label} eksik veya hatalı. Lütfen formu kontrol edip tekrar deneyin.`;
  }
  if (expected === "number" && received === "undefined") {
    return `${label} girilmedi.`;
  }
  if (expected === "string" && received === "undefined") {
    return `${label} girilmedi.`;
  }
  return `${label} geçersiz.`;
}

export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Geçersiz form verisi";
  }

  if (
    issue.message &&
    !issue.message.startsWith("Invalid input") &&
    !issue.message.startsWith("Expected") &&
    !issue.message.startsWith("Too small") &&
    !issue.message.startsWith("Too big")
  ) {
    return issue.message;
  }

  const label = labelForPath(issue.path);

  if (issue.code === "invalid_type") {
    const details = issue as {
      expected?: string;
      received?: string;
    };
    return turkishInvalidTypeMessage(
      label,
      details.expected ?? "veri",
      details.received ?? "bilinmeyen",
    );
  }

  if (issue.code === "too_small") {
    const details = issue as { minimum?: number; type?: string };
    if (details.type === "array") {
      return `${label} için en az ${details.minimum ?? 1} kayıt gerekli.`;
    }
    if (details.type === "string") {
      return `${label} boş bırakılamaz.`;
    }
    if (details.type === "number") {
      return `${label} geçerli bir tutar olmalıdır.`;
    }
  }

  return issue.message || "Geçersiz form verisi";
}
