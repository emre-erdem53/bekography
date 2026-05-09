function normalizeBase(url: string | undefined): string | undefined {
  const t = url?.trim();
  if (!t) return undefined;
  return t.replace(/\/+$/, "");
}

function blobUrunlerPrefix(): string {
  const raw = process.env.NEXT_PUBLIC_BLOB_URUNLER_PATH;
  // Varsayılan: Blob kökü (yüklemeler genelde doğrudan dosya adıyla). Alt klasör için örn. `urunler`.
  if (raw === undefined) {
    return "";
  }
  const trimmed = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `${trimmed}/` : "";
}

const blobUrunlerBase = normalizeBase(
  process.env.NEXT_PUBLIC_BLOB_URUNLER_BASE_URL,
);
const blobSharedBase = normalizeBase(process.env.NEXT_PUBLIC_BLOB_BASE_URL);

/**
 * Ürün görselleri yalnızca Vercel Blob üzerinden gelir; yerel `public` klasörü kullanılmaz.
 *
 * Zorunlu: `NEXT_PUBLIC_BLOB_URUNLER_BASE_URL` veya `NEXT_PUBLIC_BLOB_BASE_URL` (önce özel ürün kökü).
 * `NEXT_PUBLIC_BLOB_URUNLER_PATH`: Blob içi klasör (ör. `urunler`). Tanımsız → kök; boş string → kök.
 */
export function getUrunImageSrc(fileName: string): string {
  const base = blobUrunlerBase ?? blobSharedBase;
  if (!base) {
    throw new Error(
      "Ürün görselleri için NEXT_PUBLIC_BLOB_URUNLER_BASE_URL veya NEXT_PUBLIC_BLOB_BASE_URL tanımlı olmalıdır.",
    );
  }
  const prefix = blobUrunlerPrefix();
  return `${base}/${prefix}${fileName}`;
}
