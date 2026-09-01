/** Production blob store — `next.config.ts` remotePatterns ile aynı host. */
export const DEFAULT_BLOB_BASE_URL =
  "https://egirdzxkimbjwf2e.public.blob.vercel-storage.com";

export function resolveBlobSharedBase(url: string | undefined): string {
  const trimmed = url?.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_BLOB_BASE_URL;
}
