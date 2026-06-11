function normalizeBase(url: string | undefined): string | undefined {
  const t = url?.trim();
  if (!t) return undefined;
  return t.replace(/\/+$/, "");
}

function backstageBlobPrefix(): string {
  const raw = process.env.NEXT_PUBLIC_BLOB_BACKSTAGE_PATH;
  if (raw === undefined) {
    return "";
  }
  const trimmed = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `${trimmed}/` : "";
}

const backstageDedicatedBase = normalizeBase(
  process.env.NEXT_PUBLIC_BLOB_BACKSTAGE_BASE_URL,
);
const blobSharedBase = normalizeBase(process.env.NEXT_PUBLIC_BLOB_BASE_URL);

const backstagePosterExt =
  process.env.NEXT_PUBLIC_BACKSTAGE_POSTER_EXT?.replace(/^\./, "").trim() ||
  "png";

/** Hakkımızda backstage videoları: `backstage-1.mp4` … `backstage-23.mp4`. */
export const BACKSTAGE_VIDEO_FILES = Array.from(
  { length: 23 },
  (_, i) => `backstage-${i + 1}.mp4`,
);

/**
 * Backstage videoları Vercel Blob üzerinden.
 *
 * Önce `NEXT_PUBLIC_BLOB_BACKSTAGE_BASE_URL`, yoksa `NEXT_PUBLIC_BLOB_BASE_URL`.
 * `NEXT_PUBLIC_BLOB_BACKSTAGE_PATH`: Blob içi klasör; tanımsız → kök.
 */
export function getBackstageVideoSrc(fileName: string): string {
  const base = backstageDedicatedBase ?? blobSharedBase;
  if (!base) {
    throw new Error(
      "Backstage videoları için NEXT_PUBLIC_BLOB_BACKSTAGE_BASE_URL veya NEXT_PUBLIC_BLOB_BASE_URL tanımlı olmalıdır.",
    );
  }
  const prefix = backstageBlobPrefix();
  return `${base}/${prefix}${fileName}`;
}

/**
 * Ön izleme karesi: videoyla aynı dosya adı, uzantı `.png` (veya `NEXT_PUBLIC_BACKSTAGE_POSTER_EXT`).
 * Blob’ta `backstage-1.mp4` ile aynı dizinde `backstage-1.png` kullanın (sıkıştırılmış, ~400–800px genişlik ideal).
 */
export function getBackstagePosterSrc(videoFileName: string): string {
  const baseName = videoFileName.replace(/\.mp4$/i, "");
  return getBackstageVideoSrc(`${baseName}.${backstagePosterExt}`);
}
