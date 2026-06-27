import type { PackageGalleryMedia } from "@/lib/package-seed-data";

export function mergeGalleryMediaByOption(
  existing: Record<string, PackageGalleryMedia[]> | undefined,
  incoming: Record<string, PackageGalleryMedia[]> | undefined,
): Record<string, PackageGalleryMedia[]> {
  const result: Record<string, PackageGalleryMedia[]> = {};

  for (const [key, media] of Object.entries(existing ?? {})) {
    if (Array.isArray(media) && media.length > 0) {
      result[key] = media;
    }
  }

  for (const [key, media] of Object.entries(incoming ?? {})) {
    if (Array.isArray(media) && media.length > 0) {
      result[key] = media;
    }
  }

  return result;
}

export function resolveGalleryMediaForOption(
  byOption: Record<string, PackageGalleryMedia[]> | undefined,
  optionId: string,
  optionLabel?: string,
): PackageGalleryMedia[] {
  if (!byOption) return [];

  const trimmedLabel = optionLabel?.trim() ?? "";
  const candidates = [optionId, trimmedLabel, optionLabel ?? ""].filter(Boolean);

  for (const key of candidates) {
    if (byOption[key]?.length) return byOption[key];
  }

  const lowerLabel = trimmedLabel.toLocaleLowerCase("tr");
  for (const [key, media] of Object.entries(byOption)) {
    if (!media.length) continue;
    if (key.trim().toLocaleLowerCase("tr") === lowerLabel) return media;
  }

  return [];
}

export function countGalleryMediaItems(
  byOption: Record<string, PackageGalleryMedia[]> | undefined,
): number {
  return Object.values(byOption ?? {}).reduce(
    (total, media) => total + (Array.isArray(media) ? media.length : 0),
    0,
  );
}
