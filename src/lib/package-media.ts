import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");

export function packageMediaUrl(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  if (fileName.startsWith("http")) return fileName;
  return blobBaseUrl ? `${blobBaseUrl}/${fileName}` : `/reels/${fileName}`;
}

export function getCategoryGalleryUrls(category: PackageCategoryData): string[] {
  const content = category.content as PackageCategoryContent;
  const fromGallery =
    content.galleryImages
      ?.map((image) => packageMediaUrl(image.url))
      .filter((url): url is string => Boolean(url)) ?? [];

  if (fromGallery.length > 0) return fromGallery;

  const hero = packageMediaUrl(category.heroImageUrl);
  return hero ? [hero] : [];
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
