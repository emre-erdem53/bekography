import type { PackageCategoryData } from "@/lib/package-types";
import type {
  PackageCategoryContent,
  PackageGalleryMedia,
} from "@/lib/package-seed-data";

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");

export function packageMediaUrl(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  if (fileName.startsWith("http")) return fileName;
  return blobBaseUrl ? `${blobBaseUrl}/${fileName}` : `/reels/${fileName}`;
}

export function isVideoMediaUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
}


function resolveOptionMediaList(
  content: PackageCategoryContent,
  optionId: string,
  optionLabel?: string,
): PackageGalleryMedia[] {
  const byOption = content.galleryMediaByOption;
  if (byOption?.[optionId]?.length) return byOption[optionId];
  if (optionLabel && byOption?.[optionLabel]?.length) {
    return byOption[optionLabel];
  }
  return [];
}

export function getOptionGalleryMedia(
  category: PackageCategoryData,
  optionId: string,
  optionLabel?: string,
): PackageGalleryMedia[] {
  const content = category.content as PackageCategoryContent;
  return resolveOptionMediaList(content, optionId, optionLabel)
    .map((item) => ({
      ...item,
      url: packageMediaUrl(item.url) ?? item.url,
      type: item.type ?? "image",
    }))
    .filter((item) => Boolean(item.url));
}

export function getOptionGalleryPreviewUrl(
  category: PackageCategoryData,
  optionId: string,
  optionLabel?: string,
): string | null {
  const preview = getOptionGalleryPreviewMedia(category, optionId, optionLabel);
  return preview?.type === "image" ? preview.url : null;
}

export function getOptionGalleryPreviewMedia(
  category: PackageCategoryData,
  optionId: string,
  optionLabel?: string,
): { url: string; type: "image" | "video" } | null {
  const media = getOptionGalleryMedia(category, optionId, optionLabel);
  const firstImage = media.find((item) => item.type !== "video");
  if (firstImage) return { url: firstImage.url, type: "image" };
  const firstVideo = media.find((item) => item.type === "video");
  if (firstVideo) return { url: firstVideo.url, type: "video" };
  return null;
}

/** @deprecated Use getOptionGalleryMedia instead */
export function getCategoryGalleryUrls(category: PackageCategoryData): string[] {
  const content = category.content as PackageCategoryContent;
  const firstOption = category.options[0];
  if (firstOption) {
    return getOptionGalleryMedia(category, firstOption.id, firstOption.label)
      .filter((item) => item.type !== "video")
      .map((item) => item.url);
  }
  return (
    content.galleryImages
      ?.map((image) => packageMediaUrl(image.url))
      .filter((url): url is string => Boolean(url)) ?? []
  );
}

export function getCategoryPriceLabel(category: PackageCategoryData) {
  const cashPrices = category.options.map((option) => option.cashPrice);
  if (cashPrices.length === 0) return "";
  const min = Math.min(...cashPrices);
  const max = Math.max(...cashPrices);
  if (min === max) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(min);
  }
  const fmt = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);
  return `${fmt(min)} - ${fmt(max)}`;
}
