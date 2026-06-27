import type { PackageCategory, PackageOption } from "@prisma/client";
import { mergeGalleryMediaByOption } from "@/lib/package-gallery-persist";
import type {
  PackageCategoryContent,
  PackageGalleryMedia,
} from "@/lib/package-seed-data";
import { isVideoMediaUrl } from "@/lib/package-media";

type BlobItem = {
  pathname: string;
  url: string;
};

const EXPLORE_PREFIX =
  /^(?:\d+\.(?:jpg|jpeg|png|webp|mp4)|video\d+\.mp4|haziran-\d+\.png|bekir(?:-iletisim)?\.jpg|kevser\.jpg)$/i;

const CATEGORY_HINTS: Array<{ slug: string; patterns: RegExp[] }> = [
  { slug: "dis-cekim", patterns: [/dış/i, /dis[- ]?cekim/i, /outdoor/i] },
  { slug: "dugun", patterns: [/^düğün(?! salon)/i, /^dugun(?!-salon)/i] },
  {
    slug: "dugun-salon",
    patterns: [/salon/i, /düğün giriş/i, /dugun giris/i, /^düğün/i, /^0623/i],
  },
  { slug: "gelin-cikisi", patterns: [/gelin/i] },
  { slug: "kuafor", patterns: [/kuaf/i, /saç/i, /makyaj/i] },
  { slug: "full-hikaye", patterns: [/full/i, /hikaye/i] },
  { slug: "soz-isteme", patterns: [/söz/i, /soz/i, /isteme/i] },
  { slug: "kina", patterns: [/kına/i, /kina/i] },
  { slug: "nisan", patterns: [/nişan/i, /nisan/i] },
];

export type GalleryRestoreUpdate = {
  slug: string;
  added: number;
  galleryMediaByOption: Record<string, PackageGalleryMedia[]>;
};

export type GalleryRestoreResult = {
  updates: GalleryRestoreUpdate[];
  unmapped: string[];
  skippedExplore: number;
  skippedKnown: number;
};

function basename(pathname: string): string {
  try {
    return decodeURIComponent(pathname.split("/").pop() ?? pathname);
  } catch {
    return pathname;
  }
}

function isExploreAsset(pathname: string): boolean {
  return EXPLORE_PREFIX.test(basename(pathname));
}

function guessCategorySlug(pathname: string): string | null {
  const name = basename(pathname);
  for (const hint of CATEGORY_HINTS) {
    if (hint.patterns.some((pattern) => pattern.test(name))) {
      return hint.slug;
    }
  }
  return null;
}

function toGalleryMedia(pathname: string, url: string): PackageGalleryMedia {
  return {
    url,
    type:
      isVideoMediaUrl(url) || /\.(mp4|mov|webm|m4v)$/i.test(pathname)
        ? "video"
        : "image",
  };
}

export function restorePackageGalleriesFromBlobs(
  categories: Array<
    PackageCategory & {
      options: PackageOption[];
    }
  >,
  blobs: BlobItem[],
): GalleryRestoreResult {
  const knownUrls = new Set<string>();
  for (const category of categories) {
    const content = (category.content ?? {}) as PackageCategoryContent;
    for (const media of Object.values(content.galleryMediaByOption ?? {})) {
      if (!Array.isArray(media)) continue;
      for (const item of media) {
        if (item.url) knownUrls.add(item.url);
      }
    }
  }

  const grouped = new Map<string, PackageGalleryMedia[]>();
  const unmapped: string[] = [];
  let skippedExplore = 0;
  let skippedKnown = 0;

  for (const blob of blobs) {
    if (knownUrls.has(blob.url)) {
      skippedKnown += 1;
      continue;
    }
    if (isExploreAsset(blob.pathname)) {
      skippedExplore += 1;
      continue;
    }

    const slug = guessCategorySlug(blob.pathname);
    if (!slug) {
      unmapped.push(blob.pathname);
      continue;
    }

    const listForSlug = grouped.get(slug) ?? [];
    listForSlug.push(toGalleryMedia(blob.pathname, blob.url));
    grouped.set(slug, listForSlug);
  }

  const updates: GalleryRestoreUpdate[] = [];

  for (const category of categories) {
    const incoming = grouped.get(category.slug);
    if (!incoming?.length) continue;

    const content = (category.content ?? {}) as PackageCategoryContent;
    const existing = content.galleryMediaByOption ?? {};
    const primaryOption = category.options[0];
    if (!primaryOption) continue;

    const nextByOption: Record<string, PackageGalleryMedia[]> = {
      [primaryOption.id]: incoming,
      [primaryOption.label]: incoming,
    };

    updates.push({
      slug: category.slug,
      added: incoming.length,
      galleryMediaByOption: mergeGalleryMediaByOption(existing, nextByOption),
    });
  }

  return {
    updates,
    unmapped,
    skippedExplore,
    skippedKnown,
  };
}
