export type BlobMediaKind = "image" | "video";

export const BLOB_MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";

export type BlobMediaItem = {
  url: string;
  pathname: string;
  uploadedAt: string;
  type: BlobMediaKind;
  label: string;
};

export type BlobMediaFolder = {
  prefix: string;
  name: string;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|avif)(\?|#|$)/i;

export function getBlobMediaKind(pathname: string): BlobMediaKind | null {
  const name = pathname.split("/").pop() ?? pathname;
  if (VIDEO_EXT.test(name)) return "video";
  if (IMAGE_EXT.test(name)) return "image";
  return null;
}

export function decodeBlobPathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname.split("/").pop() ?? pathname);
  } catch {
    return pathname.split("/").pop() ?? pathname;
  }
}

export function normalizeBlobFolderPrefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/^\/+/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export function sanitizeBlobFolderSegment(name: string): string {
  const trimmed = name.trim().replace(/[/\\]+/g, "-");
  if (!trimmed) {
    throw new Error("Klasör adı boş olamaz");
  }

  const slug = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (!slug) {
    throw new Error("Geçerli bir klasör adı girin");
  }

  return slug;
}

export function formatBlobFolderLabel(segment: string): string {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // keep raw segment
  }

  return decoded
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getBlobFolderSegments(prefix: string): string[] {
  return normalizeBlobFolderPrefix(prefix)
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);
}

export function buildBlobUploadPath(folderPrefix: string, fileName: string): string {
  const prefix = normalizeBlobFolderPrefix(folderPrefix);
  const safeName = fileName.replace(/[/\\]+/g, "-").trim();
  return `${prefix}${safeName}`;
}

export function toBlobMediaFolder(fullPrefix: string): BlobMediaFolder {
  const normalized = normalizeBlobFolderPrefix(fullPrefix);
  const segment = normalized.replace(/\/$/, "").split("/").pop() ?? normalized;

  return {
    prefix: normalized,
    name: formatBlobFolderLabel(segment),
  };
}

export function getRelativeBlobPath(pathname: string, parentPrefix: string): string {
  const normalizedParent = normalizeBlobFolderPrefix(parentPrefix);
  const trimmedPath = pathname.replace(/^\/+/, "");

  if (!normalizedParent) return trimmedPath;
  if (!trimmedPath.startsWith(normalizedParent)) return trimmedPath;

  return trimmedPath.slice(normalizedParent.length);
}

/** pathname, parentPrefix altında doğrudan çocuk dosya mı (alt klasörde değil). */
export function isDirectBlobChild(pathname: string, parentPrefix: string): boolean {
  const relative = getRelativeBlobPath(pathname, parentPrefix);
  return relative.length > 0 && !relative.includes("/");
}

/** Tüm pathname'lerden bir seviye alt klasörleri türet. */
export function deriveChildFolderPrefixes(
  pathnames: string[],
  parentPrefix: string,
): string[] {
  const normalizedParent = normalizeBlobFolderPrefix(parentPrefix);
  const folderSet = new Set<string>();

  for (const pathname of pathnames) {
    const relative = getRelativeBlobPath(pathname, parentPrefix);
    const slashIndex = relative.indexOf("/");
    if (slashIndex <= 0) continue;

    const segment = relative.slice(0, slashIndex);
    folderSet.add(`${normalizedParent}${segment}/`);
  }

  return [...folderSet];
}

export function mapBlobToMediaItem(blob: {
  url: string;
  pathname: string;
  uploadedAt: Date;
}): BlobMediaItem | null {
  const type = getBlobMediaKind(blob.pathname);
  if (!type) return null;

  return {
    url: blob.url,
    pathname: blob.pathname,
    uploadedAt: blob.uploadedAt.toISOString(),
    type,
    label: decodeBlobPathname(blob.pathname),
  };
}
