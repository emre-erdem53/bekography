import type { ShootTypeContent } from "@/lib/package-seed-data";
import { slugify } from "@/lib/constants";

export function buildCopyTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return "Yeni Paket (Kopya)";
  if (trimmed.endsWith("(Kopya)")) return trimmed;
  return `${trimmed} (Kopya)`;
}

export function buildCopySlug(title: string) {
  const base = slugify(buildCopyTitle(title)) || "paket-kopya";
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

export type PackageCopySource = {
  serviceAreaId: string;
  title: string;
  slug: string;
  accentColor: string | null;
  iconKey: string | null;
  sortOrder: number;
  tags: string[];
  shootTypes: Array<{
    label: string;
    cashPrice: number;
    installmentPrice: number;
    iconKey: string | null;
    sortOrder: number;
    tags: string[];
    content: ShootTypeContent;
  }>;
};

/**
 * Kopyalama artık satır klonlama: her çekim türü kendi içeriğini taşıdığı için
 * eski `*ByOption` anahtar yeniden eşlemesine gerek kalmadı.
 */
export function applyPackageCopyTransform(source: PackageCopySource) {
  return {
    serviceAreaId: source.serviceAreaId,
    title: buildCopyTitle(source.title),
    slug: buildCopySlug(source.title),
    accentColor: source.accentColor,
    iconKey: source.iconKey,
    sortOrder: source.sortOrder,
    isActive: false,
    tags: source.tags,
    shootTypes: source.shootTypes.map((shootType) => ({
      label: shootType.label,
      cashPrice: shootType.cashPrice,
      installmentPrice: shootType.installmentPrice,
      iconKey: shootType.iconKey,
      sortOrder: shootType.sortOrder,
      tags: shootType.tags,
      content: shootType.content,
    })),
  };
}
