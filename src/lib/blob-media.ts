export type BlobMediaKind = "image" | "video";

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
    return pathname;
  }
}
