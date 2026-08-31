"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ImageIcon, Loader2, Play, Trash2, Video, X } from "lucide-react";
import { AdminFileUpload } from "@/components/admin/admin-file-upload";
import { BlobMediaFolderNav } from "@/components/admin/blob-media-folder-nav";
import {
  formatBlobFolderLabel,
  getBlobFolderSegments,
  type BlobMediaFolder,
  type BlobMediaItem,
} from "@/lib/blob-media";

type MediaTab = "image" | "video";

type BlobMediaResponse = {
  prefix: string;
  folders: BlobMediaFolder[];
  items: BlobMediaItem[];
  hasMore: boolean;
  nextOffset: number | null;
  total: number;
};

export function MediaLibraryClient() {
  const [tab, setTab] = useState<MediaTab>("image");
  const [prefix, setPrefix] = useState("");
  const [folders, setFolders] = useState<BlobMediaFolder[]>([]);
  const [items, setItems] = useState<BlobMediaItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewVideo, setPreviewVideo] = useState<BlobMediaItem | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (
      pageOffset: number,
      append: boolean,
      mediaType: MediaTab,
      folderPrefix: string,
    ) => {
      const params = new URLSearchParams({
        limit: "24",
        offset: String(pageOffset),
        type: mediaType,
      });
      if (folderPrefix) params.set("prefix", folderPrefix);

      const response = await fetch(`/api/admin/blob-media?${params.toString()}`);
      if (!response.ok) throw new Error("Medya listesi alınamadı");

      const data = (await response.json()) as BlobMediaResponse;
      setFolders(data.folders);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setHasMore(data.hasMore);
      setTotal(data.total);
      setOffset(data.nextOffset ?? pageOffset + data.items.length);
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchPage(0, false, tab, prefix)
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Medya listesi alınamadı",
        );
      })
      .finally(() => setLoading(false));
  }, [tab, prefix, fetchPage]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (prefix) formData.append("folder", prefix);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Dosya yüklenemedi");
      await fetchPage(0, false, tab, prefix);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Dosya yüklenemedi",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: BlobMediaItem) {
    if (
      !window.confirm(
        `"${item.label}" dosyasını kalıcı olarak silmek istiyor musunuz?`,
      )
    ) {
      return;
    }

    setDeletingPath(item.pathname);
    setError("");
    try {
      const response = await fetch("/api/admin/blob-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: item.pathname, url: item.url }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Dosya silinemedi");
      }
      setItems((prev) => prev.filter((entry) => entry.pathname !== item.pathname));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Dosya silinemedi",
      );
    } finally {
      setDeletingPath(null);
    }
  }

  const accept =
    tab === "image"
      ? "image/jpeg,image/png,image/webp,image/gif,image/avif"
      : "video/mp4,video/webm,video/quicktime";

  const uploadHint = prefix
    ? `"${formatBlobFolderLabel(getBlobFolderSegments(prefix).at(-1)! )}" klasörüne yüklenecek`
    : tab === "image"
      ? "JPEG, PNG, WebP, GIF veya AVIF — ürün klasörüne girmek için yukarıdan seçin"
      : "MP4, WebM veya MOV — ürün klasörüne girmek için yukarıdan seçin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Medya Kütüphanesi</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ürün bazlı klasörler oluşturup görselleri ve videoları ayrı ayrı
            yönetin. Bu klasörde: {total} dosya
          </p>
        </div>
        <div className="flex rounded-xl border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setTab("image")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "image"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Fotoğraflar
          </button>
          <button
            type="button"
            onClick={() => setTab("video")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "video"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Video className="h-4 w-4" />
            Videolar
          </button>
        </div>
      </div>

      <BlobMediaFolderNav
        prefix={prefix}
        folders={folders}
        onPrefixChange={setPrefix}
        onCreateFolder={setPrefix}
      />

      <AdminFileUpload
        accept={accept}
        onFileSelect={(file) => void handleUpload(file)}
        label={
          uploading
            ? "Yükleniyor..."
            : prefix
              ? "Bu klasöre yükle"
              : "Kütüphaneye yükle"
        }
        hint={uploadHint}
        disabled={uploading}
      />

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-zinc-400">
          {prefix
            ? "Bu klasörde henüz dosya yok. Yukarıdan yükleyebilirsiniz."
            : folders.length > 0
              ? "Bir klasör seçin veya köke dosya yükleyin."
              : "Bu kategoride henüz dosya yok."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.pathname}
              className="group overflow-hidden rounded-xl border border-white/10 bg-[#111]"
            >
              <div className="relative aspect-square bg-black">
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.label}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(item)}
                    className="relative h-full w-full"
                  >
                    <video
                      src={item.url}
                      preload="metadata"
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <Play className="h-8 w-8 text-white" />
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  disabled={deletingPath === item.pathname}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-red-300 opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                  aria-label="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1 px-3 py-2">
                <p className="truncate text-xs font-medium text-white" title={item.label}>
                  {item.label}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {format(new Date(item.uploadedAt), "d MMM yyyy HH:mm", {
                    locale: tr,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={() => {
            setLoadingMore(true);
            fetchPage(offset, true, tab, prefix)
              .catch(() => setError("Daha fazla medya yüklenemedi"))
              .finally(() => setLoadingMore(false));
          }}
          disabled={loadingMore}
          className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
        >
          {loadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
        </button>
      ) : null}

      {previewVideo ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setPreviewVideo(null)}
              className="absolute -top-10 right-0 rounded-lg p-2 text-white hover:bg-white/10"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={previewVideo.url}
              controls
              autoPlay
              className="max-h-[80vh] w-full rounded-2xl bg-black"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
