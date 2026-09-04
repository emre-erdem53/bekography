/**
 * Full gün / gün boyu hikaye paketlerinde paket adı (Romantik, Prime)
 * müşteriye kapsanan çekimleri anlatmaz. Başlık altı metin, paketin
 * admin etiketlerinden üretilir (saat aralığı gibi meta etiketler hariç).
 *
 * Paket kapsamı değişince: Admin → Paketler → ilgili paket → etiketleri güncelle.
 */

const TIME_OR_DURATION_TAG =
  /\d{1,2}[.:]\d{2}|saat\s*süre|gün\s*batımı/i;

export function isFullDayStoryServiceArea(
  serviceAreaTitle: string,
  serviceAreaSlug = "",
): boolean {
  const title = serviceAreaTitle.trim().toLocaleLowerCase("tr-TR");
  const slug = serviceAreaSlug.trim().toLocaleLowerCase("tr-TR");
  if (
    slug === "full-dugun-gunu" ||
    slug === "full-hikaye" ||
    slug.includes("gun-boyu") ||
    slug.includes("gün-boyu")
  ) {
    return true;
  }
  return (
    title.includes("gün boyu") ||
    title.includes("full düğün") ||
    title.includes("full hikaye") ||
    /\bhikaye\b/.test(title)
  );
}

function isCoverageTag(tag: string): boolean {
  const value = tag.trim();
  if (!value) return false;
  return !TIME_OR_DURATION_TAG.test(value);
}

export function coverageLabelFromPackageTags(
  packageTags: string[] | null | undefined,
): string | null {
  if (!packageTags?.length) return null;
  const parts = packageTags.map((tag) => tag.trim()).filter(isCoverageTag);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

export function resolveFullDayStoryCoverageLabel(
  serviceAreaTitle: string,
  packageTitle: string,
  packageTags?: string[] | null,
  serviceAreaSlug = "",
): string | null {
  if (!isFullDayStoryServiceArea(serviceAreaTitle, serviceAreaSlug)) {
    return null;
  }

  const fromTags = coverageLabelFromPackageTags(packageTags);
  if (fromTags) return fromTags;

  // Eski kayıtlarda etiket yoksa paket adına göre son çare.
  const pkg = packageTitle.trim().toLocaleLowerCase("tr-TR");
  if (pkg.includes("romantik")) {
    return "Dış Çekim, Gelin Çıkışı, Düğün Giriş Dans";
  }
  if (pkg.includes("prime")) {
    return "Bride Hazırlık, Dış Çekim, Gelin Çıkışı, Düğün Giriş Dans, Eğlence";
  }
  return null;
}
