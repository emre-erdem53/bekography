import type {
  PackageDetailSection,
  PackageGalleryMedia,
  PackageServiceItem,
  ServiceAreaContent,
  ShootTypeContent,
} from "@/lib/package-seed-data";
import type { ScheduleType } from "@/lib/package-types";
import {
  getShootTypeDetailSections,
  normalizeDetailSections,
} from "@/lib/package-detail-section";
import {
  getShootTypeGalleryMedia,
  getShootTypeGalleryPreviewMedia,
} from "@/lib/package-media";

export const PRODUCT_SNAPSHOT_VERSION = 3;

export type ReservationProductSnapshot = {
  shootTypeId: string;
  shootTypeLabelRaw: string;
  packageId: string;
  packageTitle: string;
  serviceAreaId: string;
  serviceAreaSlug: string;
  serviceAreaTitle: string;
  scheduleType: ScheduleType;
  accentColor: string;
  cashPrice: number;
  installmentPrice: number;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  /** "Fotoğraf + Video" gibi normalize edilmiş kısa etiket. */
  shootTypeLabel: string;
  highlightTags: string[];
  detailSections: PackageDetailSection[];
  services: PackageServiceItem[];
  galleryMedia: PackageGalleryMedia[];
  snapshotVersion: number;
};

export function emptyProductSnapshot(): ReservationProductSnapshot {
  return {
    shootTypeId: "",
    shootTypeLabelRaw: "",
    packageId: "",
    packageTitle: "",
    serviceAreaId: "",
    serviceAreaSlug: "",
    serviceAreaTitle: "",
    scheduleType: "indoor",
    accentColor: "#ffffff",
    cashPrice: 0,
    installmentPrice: 0,
    previewImageUrl: null,
    previewVideoUrl: null,
    shootTypeLabel: "",
    highlightTags: [],
    detailSections: [],
    services: [],
    galleryMedia: [],
    snapshotVersion: PRODUCT_SNAPSHOT_VERSION,
  };
}

export function getShootTypeLabel(label: string): string {
  const lower = label.toLowerCase();
  const hasPhoto = lower.includes("fotoğraf") || lower.includes("fotograf");
  const hasVideo = lower.includes("video") || lower.includes("film");

  if (hasPhoto && hasVideo) return "Fotoğraf + Video";
  if (hasVideo) return "Video";
  if (hasPhoto) return "Fotoğraf";
  return label;
}

/** Prisma'dan `shootType.findMany({ include: { package: { include: { serviceArea: true } } } })` şekli. */
export type ShootTypeWithParents = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  tags: string[];
  content: unknown;
  package: {
    id: string;
    title: string;
    serviceArea: {
      id: string;
      slug: string;
      title: string;
      accentColor: string;
      scheduleType: string;
      content: unknown;
    };
  };
};

export function buildProductSnapshotFromShootType(
  shootType: ShootTypeWithParents,
): ReservationProductSnapshot {
  const pkg = shootType.package;
  const serviceArea = pkg.serviceArea;
  const shootTypeContent = (shootType.content ?? {}) as ShootTypeContent;
  const serviceAreaContent = (serviceArea.content ?? {}) as ServiceAreaContent;
  const shootTypeData = { content: shootTypeContent };

  const preview = getShootTypeGalleryPreviewMedia(shootTypeData);

  return {
    shootTypeId: shootType.id,
    shootTypeLabelRaw: shootType.label,
    packageId: pkg.id,
    packageTitle: pkg.title,
    serviceAreaId: serviceArea.id,
    serviceAreaSlug: serviceArea.slug,
    serviceAreaTitle: serviceArea.title,
    scheduleType: serviceArea.scheduleType as ScheduleType,
    accentColor: serviceArea.accentColor,
    cashPrice: shootType.cashPrice,
    installmentPrice: shootType.installmentPrice,
    previewImageUrl: preview?.type === "image" ? preview.url : null,
    previewVideoUrl: preview?.type === "video" ? preview.url : null,
    shootTypeLabel: getShootTypeLabel(shootType.label),
    highlightTags: shootType.tags,
    detailSections: getShootTypeDetailSections(shootTypeData),
    services: serviceAreaContent.services ?? [],
    galleryMedia: getShootTypeGalleryMedia(shootTypeData),
    snapshotVersion: PRODUCT_SNAPSHOT_VERSION,
  };
}

function hasSnapshotDetailContent(
  snapshot: ReservationProductSnapshot,
): boolean {
  return (
    snapshot.detailSections.length > 0 ||
    snapshot.services.length > 0 ||
    snapshot.galleryMedia.length > 0
  );
}

export function snapshotNeedsDetailEnrichment(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  const data = value as Record<string, unknown>;
  if (data.snapshotVersion !== PRODUCT_SNAPSHOT_VERSION) return true;
  return (
    !Array.isArray(data.detailSections) || !Array.isArray(data.galleryMedia)
  );
}

/** Satın alma anındaki alanları korur; eksik detay alanlarını kayıt anındaki tam snapshot ile tamamlar. */
export function mergeProductSnapshot(
  stored: ReservationProductSnapshot,
  fresh: ReservationProductSnapshot,
): ReservationProductSnapshot {
  if (!stored.shootTypeId) return fresh;

  const galleryMedia =
    stored.galleryMedia.length > 0
      ? stored.galleryMedia
      : fresh.galleryMedia.length > 0
        ? fresh.galleryMedia
        : buildGalleryFromPreview(stored);

  return {
    ...stored,
    cashPrice: stored.cashPrice || fresh.cashPrice,
    installmentPrice: stored.installmentPrice || fresh.installmentPrice,
    accentColor: stored.accentColor || fresh.accentColor,
    serviceAreaId: stored.serviceAreaId || fresh.serviceAreaId,
    serviceAreaSlug: stored.serviceAreaSlug || fresh.serviceAreaSlug,
    serviceAreaTitle: stored.serviceAreaTitle || fresh.serviceAreaTitle,
    // v2 kayıtlarında paket seviyesi yok; canlı veriden doldurulur.
    packageId: stored.packageId || fresh.packageId,
    packageTitle: stored.packageTitle || fresh.packageTitle,
    shootTypeLabelRaw: stored.shootTypeLabelRaw || fresh.shootTypeLabelRaw,
    scheduleType: stored.scheduleType || fresh.scheduleType,
    previewImageUrl: stored.previewImageUrl ?? fresh.previewImageUrl,
    previewVideoUrl: stored.previewVideoUrl ?? fresh.previewVideoUrl,
    shootTypeLabel: stored.shootTypeLabel || fresh.shootTypeLabel,
    highlightTags:
      stored.highlightTags.length > 0
        ? stored.highlightTags
        : fresh.highlightTags,
    detailSections:
      stored.detailSections.length > 0
        ? stored.detailSections
        : fresh.detailSections,
    services: stored.services.length > 0 ? stored.services : fresh.services,
    galleryMedia,
    snapshotVersion: PRODUCT_SNAPSHOT_VERSION,
  };
}

function buildGalleryFromPreview(
  snapshot: ReservationProductSnapshot,
): PackageGalleryMedia[] {
  const media: PackageGalleryMedia[] = [];
  if (snapshot.previewVideoUrl) {
    media.push({ url: snapshot.previewVideoUrl, type: "video" });
  }
  if (snapshot.previewImageUrl) {
    media.push({ url: snapshot.previewImageUrl, type: "image" });
  }
  return media;
}

export function resolveProductSnapshot(
  stored: ReservationProductSnapshot,
  shootType?: ShootTypeWithParents | null,
  rawStored?: unknown,
): ReservationProductSnapshot {
  const withGallery =
    stored.galleryMedia.length > 0
      ? stored
      : { ...stored, galleryMedia: buildGalleryFromPreview(stored) };

  if (!shootType) return withGallery;

  const fresh = buildProductSnapshotFromShootType(shootType);
  if (!stored.shootTypeId) return fresh;

  if (rawStored !== undefined && !snapshotNeedsDetailEnrichment(rawStored)) {
    return withGallery;
  }

  if (rawStored === undefined && hasSnapshotDetailContent(withGallery)) {
    return withGallery;
  }

  return mergeProductSnapshot(withGallery, fresh);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * v3 ve v2 snapshot'larını okur. Geçmiş rezervasyonlar backfill edilmediği
 * için v2 alan adları (`packageOptionId`, `category*`, `optionLabel`) v3
 * karşılıklarına eşlenir; v2'de paket seviyesi olmadığından `packageTitle` boş
 * kalır ve gerekirse canlı veriden tamamlanır.
 */
export function parseProductSnapshot(
  value: unknown,
): ReservationProductSnapshot {
  if (!value || typeof value !== "object") {
    return emptyProductSnapshot();
  }

  const data = value as Record<string, unknown>;

  const shootTypeId =
    readString(data.shootTypeId) || readString(data.packageOptionId);
  const serviceAreaId =
    readString(data.serviceAreaId) || readString(data.categoryId);
  const serviceAreaSlug =
    readString(data.serviceAreaSlug) || readString(data.categorySlug);
  const serviceAreaTitle =
    readString(data.serviceAreaTitle) || readString(data.categoryTitle);
  const shootTypeLabelRaw =
    readString(data.shootTypeLabelRaw) || readString(data.optionLabel);

  const scheduleType =
    data.scheduleType === "outdoor" ? "outdoor" : ("indoor" as ScheduleType);

  return {
    shootTypeId,
    shootTypeLabelRaw,
    packageId: readString(data.packageId),
    packageTitle: readString(data.packageTitle),
    serviceAreaId,
    serviceAreaSlug,
    serviceAreaTitle,
    scheduleType,
    accentColor: readString(data.accentColor) || "#ffffff",
    cashPrice: typeof data.cashPrice === "number" ? data.cashPrice : 0,
    installmentPrice:
      typeof data.installmentPrice === "number" ? data.installmentPrice : 0,
    previewImageUrl:
      typeof data.previewImageUrl === "string" ? data.previewImageUrl : null,
    previewVideoUrl:
      typeof data.previewVideoUrl === "string" ? data.previewVideoUrl : null,
    shootTypeLabel:
      readString(data.shootTypeLabel) || getShootTypeLabel(shootTypeLabelRaw),
    highlightTags: Array.isArray(data.highlightTags)
      ? data.highlightTags.filter(
          (tag): tag is string => typeof tag === "string",
        )
      : [],
    detailSections: Array.isArray(data.detailSections)
      ? normalizeDetailSections(
          data.detailSections.filter(
            (section): section is PackageDetailSection =>
              !!section && typeof section === "object",
          ),
        )
      : [],
    services: Array.isArray(data.services)
      ? data.services.filter(
          (service): service is PackageServiceItem =>
            !!service &&
            typeof service === "object" &&
            typeof (service as PackageServiceItem).title === "string",
        )
      : [],
    galleryMedia: Array.isArray(data.galleryMedia)
      ? data.galleryMedia.filter(
          (item): item is PackageGalleryMedia =>
            !!item &&
            typeof item === "object" &&
            typeof (item as PackageGalleryMedia).url === "string",
        )
      : [],
    snapshotVersion:
      typeof data.snapshotVersion === "number" ? data.snapshotVersion : 0,
  };
}

export function isProductSnapshotComplete(
  snapshot: ReservationProductSnapshot,
): boolean {
  return Boolean(snapshot.shootTypeId && snapshot.serviceAreaTitle);
}

export function isProductSnapshotDetailed(
  snapshot: ReservationProductSnapshot,
): boolean {
  return (
    isProductSnapshotComplete(snapshot) && hasSnapshotDetailContent(snapshot)
  );
}
