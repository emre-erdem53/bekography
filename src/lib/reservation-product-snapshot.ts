import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { getOptionGalleryPreviewMedia } from "@/lib/package-media";

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
  };
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
  };
}

export function isProductSnapshotComplete(
  snapshot: ReservationProductSnapshot,
): boolean {
  return Boolean(snapshot.packageOptionId && snapshot.categoryTitle);
}
