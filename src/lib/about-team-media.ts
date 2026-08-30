import { resolveBlobSharedBase } from "@/lib/blob-base-url";

function normalizeBase(url: string | undefined): string | undefined {
  const t = url?.trim();
  if (!t) return undefined;
  return t.replace(/\/+$/, "");
}

function aboutBlobPrefix(): string {
  const raw = process.env.NEXT_PUBLIC_BLOB_ABOUT_PATH;
  if (raw === undefined) {
    return "";
  }
  const trimmed = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `${trimmed}/` : "";
}

const aboutDedicatedBase = normalizeBase(
  process.env.NEXT_PUBLIC_BLOB_ABOUT_BASE_URL,
);
const blobSharedBase = resolveBlobSharedBase(
  process.env.NEXT_PUBLIC_BLOB_BASE_URL,
);

export const ABOUT_TEAM_PORTRAIT_FILES = {
  kevser: "kevser.jpg",
  bekir: "bekir.jpg",
  bekirContact: "bekir-iletisim.jpg",
} as const;

/**
 * Hakkımızda ekip portreleri — Vercel Blob (`kevser.jpg`, `bekir.jpg`).
 *
 * Önce `NEXT_PUBLIC_BLOB_ABOUT_BASE_URL`, yoksa `NEXT_PUBLIC_BLOB_BASE_URL`.
 * `NEXT_PUBLIC_BLOB_ABOUT_PATH`: Blob içi klasör (ör. `about`); tanımsız → kök.
 */
export function getAboutTeamPortraitSrc(fileName: string): string {
  const base = aboutDedicatedBase ?? blobSharedBase;
  const prefix = aboutBlobPrefix();
  return `${base}/${prefix}${fileName}`;
}
