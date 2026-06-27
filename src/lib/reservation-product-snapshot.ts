import type { PackageCategoryData } from "@/lib/package-types";
import type {
  PackageCategoryContent,
  PackageDetailSection,
  PackageGalleryMedia,
  PackageServiceItem,
} from "@/lib/package-seed-data";
import { normalizeDetailSections } from "@/lib/package-detail-section";
import { getOptionGalleryMedia, getOptionGalleryPreviewMedia } from "@/lib/package-media";

export type ReservationProductSnapshot = {
  packageOptionId: string;
  categoryId: string;
  categorySlug: string;
  categoryTitle: string;
  optionLabel: string;
  accentColor: string;
  cashPrice: number;
  installmentPrice: number;
  previewImageUrl: string | null;
  previewVideoUrl: string | null;
  shootTypeLabel: string;
  highlightTags: string[];
  detailSections: PackageDetailSection[];
  services: PackageServiceItem[];
  shootDescription: string;
  galleryMedia: PackageGalleryMedia[];
};

export function emptyProductSnapshot(): ReservationProductSnapshot {
  return {
    packageOptionId: "",
    categoryId: "",
    categorySlug: "",
    categoryTitle: "",
    optionLabel: "",
    accentColor: "#ffffff",
    cashPrice: 0,
    installmentPrice: 0,
    previewImageUrl: null,
    previewVideoUrl: null,
    shootTypeLabel: "",
    highlightTags: [],
    detailSections: [],
    services: [],
    shootDescription: "",
    galleryMedia: [],
  };
}

export function getShootTypeLabel(optionLabel: string): string {
  const lower = optionLabel.toLowerCase();
  const hasPhoto = lower.includes("fotoğraf") || lower.includes("fotograf");
  const hasVideo = lower.includes("video") || lower.includes("film");

  if (hasPhoto && hasVideo) return "Fotoğraf + Video";
  if (hasVideo) return "Video";
  if (hasPhoto) return "Fotoğraf";
  return optionLabel;
}

type PackageOptionWithCategory = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  category: {
    id: string;
    slug: string;
    title: string;
    accentColor: string;
    content: unknown;
  };
};

function toCategoryData(
  category: PackageOptionWithCategory["category"],
  option: PackageOptionWithCategory,
): PackageCategoryData {
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    accentColor: category.accentColor,
    iconKey: "Camera",
    highlight: false,
    backgroundImageUrl: null,
    heroImageUrl: null,
    content: (category.content ?? {}) as PackageCategoryContent,
    options: [
      {
        id: option.id,
        label: option.label,
        cashPrice: option.cashPrice,
        installmentPrice: option.installmentPrice,
      },
    ],
  };
}

function getSnapshotDetailSections(
  content: PackageCategoryContent,
  optionId: string,
  optionLabel: string,
): PackageDetailSection[] {
  const scoped =
    content.detailSectionsByOption?.[optionId] ??
    content.detailSectionsByOption?.[optionLabel] ??
    content.detailSections;

  return normalizeDetailSections(scoped).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function buildProductSnapshotFromOption(
  option: PackageOptionWithCategory,
): ReservationProductSnapshot {
  const category = option.category;
  const content = (category.content ?? {}) as PackageCategoryContent;
  const categoryData = toCategoryData(category, option);
  const preview = getOptionGalleryPreviewMedia(
    categoryData,
    option.id,
    option.label,
  );
  const galleryMedia = getOptionGalleryMedia(categoryData, option.id, option.label);
  const highlightTags =
    content.highlightTagsByOption?.[option.id] ??
    content.highlightTagsByOption?.[option.label] ??
    content.highlightTags ??
    [];

  return {
    packageOptionId: option.id,
    categoryId: category.id,
    categorySlug: category.slug,
    categoryTitle: category.title,
    optionLabel: option.label,
    accentColor: category.accentColor,
    cashPrice: option.cashPrice,
    installmentPrice: option.installmentPrice,
    previewImageUrl: preview?.type === "image" ? preview.url : null,
    previewVideoUrl: preview?.type === "video" ? preview.url : null,
    shootTypeLabel: getShootTypeLabel(option.label),
    highlightTags,
    detailSections: getSnapshotDetailSections(content, option.id, option.label),
    services: content.services ?? [],
    shootDescription: content.shootDescription ?? "",
    galleryMedia,
  };
}

function hasSnapshotDetailContent(snapshot: ReservationProductSnapshot): boolean {
  return (
    snapshot.detailSections.length > 0 ||
    snapshot.services.length > 0 ||
    Boolean(snapshot.shootDescription.trim()) ||
    snapshot.galleryMedia.length > 0
  );
}

export function snapshotNeedsDetailEnrichment(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  const data = value as Record<string, unknown>;
  return !("detailSections" in data) || !("galleryMedia" in data);
}

/** Satın alma anındaki alanları korur; eksik detay alanlarını kayıt anındaki tam snapshot ile tamamlar. */
export function mergeProductSnapshot(
  stored: ReservationProductSnapshot,
  fresh: ReservationProductSnapshot,
): ReservationProductSnapshot {
  if (!stored.packageOptionId) return fresh;

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
    categoryTitle: stored.categoryTitle || fresh.categoryTitle,
    optionLabel: stored.optionLabel || fresh.optionLabel,
    previewImageUrl: stored.previewImageUrl ?? fresh.previewImageUrl,
    previewVideoUrl: stored.previewVideoUrl ?? fresh.previewVideoUrl,
    shootTypeLabel: stored.shootTypeLabel || fresh.shootTypeLabel,
    highlightTags:
      stored.highlightTags.length > 0 ? stored.highlightTags : fresh.highlightTags,
    detailSections:
      stored.detailSections.length > 0
        ? stored.detailSections
        : fresh.detailSections,
    services: stored.services.length > 0 ? stored.services : fresh.services,
    shootDescription: stored.shootDescription.trim()
      ? stored.shootDescription
      : fresh.shootDescription,
    galleryMedia,
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
  option?: PackageOptionWithCategory | null,
  rawStored?: unknown,
): ReservationProductSnapshot {
  const withGallery =
    stored.galleryMedia.length > 0
      ? stored
      : { ...stored, galleryMedia: buildGalleryFromPreview(stored) };

  if (!option) return withGallery;

  const fresh = buildProductSnapshotFromOption(option);
  if (!stored.packageOptionId) return fresh;

  if (rawStored !== undefined && !snapshotNeedsDetailEnrichment(rawStored)) {
    return withGallery;
  }

  if (rawStored === undefined && hasSnapshotDetailContent(withGallery)) {
    return withGallery;
  }

  return mergeProductSnapshot(withGallery, fresh);
}

export function parseProductSnapshot(value: unknown): ReservationProductSnapshot {
  if (!value || typeof value !== "object") {
    return emptyProductSnapshot();
  }

  const data = value as Partial<ReservationProductSnapshot>;
  return {
    packageOptionId:
      typeof data.packageOptionId === "string" ? data.packageOptionId : "",
    categoryId: typeof data.categoryId === "string" ? data.categoryId : "",
    categorySlug: typeof data.categorySlug === "string" ? data.categorySlug : "",
    categoryTitle:
      typeof data.categoryTitle === "string" ? data.categoryTitle : "",
    optionLabel: typeof data.optionLabel === "string" ? data.optionLabel : "",
    accentColor:
      typeof data.accentColor === "string" ? data.accentColor : "#ffffff",
    cashPrice: typeof data.cashPrice === "number" ? data.cashPrice : 0,
    installmentPrice:
      typeof data.installmentPrice === "number" ? data.installmentPrice : 0,
    previewImageUrl:
      typeof data.previewImageUrl === "string" ? data.previewImageUrl : null,
    previewVideoUrl:
      typeof data.previewVideoUrl === "string" ? data.previewVideoUrl : null,
    shootTypeLabel:
      typeof data.shootTypeLabel === "string" ? data.shootTypeLabel : "",
    highlightTags: Array.isArray(data.highlightTags)
      ? data.highlightTags.filter((tag): tag is string => typeof tag === "string")
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
    shootDescription:
      typeof data.shootDescription === "string" ? data.shootDescription : "",
    galleryMedia: Array.isArray(data.galleryMedia)
      ? data.galleryMedia.filter(
          (item): item is PackageGalleryMedia =>
            !!item &&
            typeof item === "object" &&
            typeof (item as PackageGalleryMedia).url === "string",
        )
      : [],
  };
}

export function isProductSnapshotComplete(
  snapshot: ReservationProductSnapshot,
): boolean {
  return Boolean(snapshot.packageOptionId && snapshot.categoryTitle);
}

export function isProductSnapshotDetailed(
  snapshot: ReservationProductSnapshot,
): boolean {
  return (
    isProductSnapshotComplete(snapshot) && hasSnapshotDetailContent(snapshot)
  );
}
