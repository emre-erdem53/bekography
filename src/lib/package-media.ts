import type { PackageGalleryMedia } from "@/lib/package-seed-data";
import type { PackageData, ShootTypeData } from "@/lib/package-types";

const blobBaseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/+$/, "");

export function packageMediaUrl(
  fileName: string | null | undefined,
): string | null {
  if (!fileName) return null;
  // Tam URL veya sitedeki mutlak yol (örn. /deneme.png) olduğu gibi kalır.
  if (fileName.startsWith("http") || fileName.startsWith("/")) return fileName;
  return blobBaseUrl ? `${blobBaseUrl}/${fileName}` : `/reels/${fileName}`;
}

export function isVideoMediaUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
}

export function getShootTypeGalleryMedia(
  shootType: Pick<ShootTypeData, "content">,
): PackageGalleryMedia[] {
  return (shootType.content.galleryMedia ?? [])
    .map((item) => ({
      ...item,
      url: packageMediaUrl(item.url) ?? item.url,
      type: item.type ?? ("image" as const),
    }))
    .filter((item) => Boolean(item.url));
}

export function getShootTypeGalleryPreviewMedia(
  shootType: Pick<ShootTypeData, "content">,
): { url: string; type: "image" | "video" } | null {
  const media = getShootTypeGalleryMedia(shootType);
  const firstImage = media.find((item) => item.type !== "video");
  if (firstImage) return { url: firstImage.url, type: "image" };
  const firstVideo = media.find((item) => item.type === "video");
  if (firstVideo) return { url: firstVideo.url, type: "video" };
  return null;
}

export function getShootTypeGalleryPreviewUrl(
  shootType: Pick<ShootTypeData, "content">,
): string | null {
  const preview = getShootTypeGalleryPreviewMedia(shootType);
  return preview?.type === "image" ? preview.url : null;
}

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function formatPriceRange(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return priceFormatter.format(min);
  return `${priceFormatter.format(min)} - ${priceFormatter.format(max)}`;
}

export function getPackagePriceLabel(
  pkg: Pick<PackageData, "shootTypes">,
): string {
  return formatPriceRange(pkg.shootTypes.map((shootType) => shootType.cashPrice));
}

export function getServiceAreaPriceLabel(
  serviceArea: { packages: Array<Pick<PackageData, "shootTypes">> },
): string {
  return formatPriceRange(
    serviceArea.packages.flatMap((pkg) =>
      pkg.shootTypes.map((shootType) => shootType.cashPrice),
    ),
  );
}
