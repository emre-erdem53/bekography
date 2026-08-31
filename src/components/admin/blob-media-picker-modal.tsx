"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Play,
  Video,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { BlobMediaFolderNav } from "@/components/admin/blob-media-folder-nav";
import type { PackageGalleryMedia } from "@/lib/package-seed-data";
import type { BlobMediaFolder, BlobMediaItem } from "@/lib/blob-media";

type BlobMediaResponse = {
  prefix: string;
  folders: BlobMediaFolder[];
  items: BlobMediaItem[];
  hasMore: boolean;
  nextOffset: number | null;
};

type BlobMediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (items: PackageGalleryMedia[]) => void;
  existingUrls?: string[];
  title?: string;
  initialFolder?: string;
};

function moveSelectedItem(order: string[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= order.length) return order;
  const next = [...order];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function BlobMediaPickerModal({
  open,
  onClose,
  onSelect,
  existingUrls = [],
  title = "Medya Kütüphanesi",
  initialFolder = "",
}: BlobMediaPickerModalProps) {
  const [prefix, setPrefix] = useState(initialFolder);
  const [folders, setFolders] = useState<BlobMediaFolder[]>([]);
  const [items, setItems] = useState<BlobMediaItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [itemCache, setItemCache] = useState<Map<string, BlobMediaItem>>(
    new Map(),
  );
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [previewVideo, setPreviewVideo] = useState<BlobMediaItem | null>(null);

  const existingSet = new Set(existingUrls);
  const isRoot = prefix === "";
  const showRootItems = !isRoot || folders.length === 0;

  const fetchPage = useCallback(
    async (pageOffset: number, append: boolean, folderPrefix: string) => {
      const params = new URLSearchParams({
        limit: "20",
        offset: String(pageOffset),
      });
      if (folderPrefix) params.set("prefix", folderPrefix);

      const response = await fetch(`/api/admin/blob-media?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Medya listesi alınamadı");
      }

      const data = (await response.json()) as BlobMediaResponse;
      setFolders(data.folders);
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setItemCache((prev) => {
        const next = new Map(prev);
        for (const item of data.items) next.set(item.url, item);
        return next;
      });
      setHasMore(data.hasMore);
      setOffset(data.nextOffset ?? pageOffset + data.items.length);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedOrder([]);
    setPreviewVideo(null);
    setPrefix(initialFolder);
  }, [open, initialFolder]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setItems([]);
    setOffset(0);
    setError("");

    fetchPage(0, false, prefix)
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Medya listesi alınamadı",
        );
      })
      .finally(() => setLoading(false));
  }, [open, prefix, fetchPage]);

  function toggleItem(item: BlobMediaItem) {
    if (existingSet.has(item.url)) return;

    setItemCache((prev) => new Map(prev).set(item.url, item));
    setSelectedOrder((prev) => {
      const index = prev.indexOf(item.url);
      if (index >= 0) {
        return prev.filter((url) => url !== item.url);
      }
      return [...prev, item.url];
    });
  }

  function getSelectionNumber(url: string) {
    const index = selectedOrder.indexOf(url);
    return index >= 0 ? index + 1 : null;
  }

  function handleConfirm() {
    const chosen = selectedOrder
      .map((url) => itemCache.get(url))
      .filter((item): item is BlobMediaItem => !!item);

    onSelect(
      chosen.map((item) => ({
        url: item.url,
        type: item.type,
      })),
    );
    onClose();
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    setError("");
    try {
      await fetchPage(offset, true, prefix);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Daha fazla medya yüklenemedi",
      );
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#111] shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Ürün klasörünü seçin, ardından tıklama sırasına göre medya
                  ekleyin. Seçilen sıra galeri sırası olur.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-white/10 px-5 py-4">
              <BlobMediaFolderNav
                prefix={prefix}
                folders={folders}
                onPrefixChange={setPrefix}
                onCreateFolder={setPrefix}
                allowCreateFolder={false}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Medyalar yükleniyor...
                </div>
              ) : error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              ) : !showRootItems ? (
                <p className="py-10 text-center text-sm text-zinc-500">
                  Devam etmek için yukarıdan bir ürün klasörü seçin.
                </p>
              ) : items.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  {prefix
                    ? "Bu klasörde medya yok. Önce Medya Kütüphanesi'ne yükleyin."
                    : folders.length > 0
                      ? "Ürün klasörünü seçin."
                      : "Medya bulunamadı."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => {
                    const isExisting = existingSet.has(item.url);
                    const selectionNumber = getSelectionNumber(item.url);
                    const isSelected = selectionNumber !== null;

                    return (
                      <div
                        key={item.url}
                        className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
                          isExisting
                            ? "cursor-not-allowed border-white/5 opacity-45"
                            : isSelected
                              ? "border-[#93f8b6] ring-2 ring-[#93f8b6]/40"
                              : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <div className="relative aspect-square bg-[#1a1a1a]">
                          {item.type === "video" ? (
                            <>
                              <video
                                src={item.url}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewVideo(item)}
                                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100"
                                aria-label="Videoyu oynat"
                              >
                                <Play className="h-8 w-8 text-white" />
                              </button>
                            </>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.label}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          )}
                          <button
                            type="button"
                            disabled={isExisting}
                            onClick={() => toggleItem(item)}
                            className="absolute inset-0 disabled:cursor-not-allowed"
                            aria-label={
                              isSelected ? "Seçimi kaldır" : "Sıraya ekle"
                            }
                          />
                          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white">
                            {item.type === "video" ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <ImageIcon className="h-3 w-3" />
                            )}
                            {item.type === "video" ? "Video" : "Görsel"}
                          </span>
                          {selectionNumber ? (
                            <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#93f8b6] text-sm font-bold text-black">
                              {selectionNumber}
                            </span>
                          ) : null}
                          {isExisting ? (
                            <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-full bg-black/80 px-2 py-1 text-center text-[10px] text-zinc-300">
                              Galeride
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-0.5 px-2 py-2">
                          <p className="truncate text-[11px] font-medium text-white">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {format(new Date(item.uploadedAt), "d MMM yyyy HH:mm", {
                              locale: tr,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasMore && !loading && showRootItems ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore ? "Yükleniyor..." : "Daha fazla yükle"}
                  </button>
                </div>
              ) : null}
            </div>

            {selectedOrder.length > 0 ? (
              <div className="border-t border-white/10 px-5 py-3">
                <p className="mb-2 text-xs text-zinc-500">
                  Seçim sırası — galeriye bu sırayla eklenecek
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedOrder.map((url, index) => {
                    const item = itemCache.get(url);
                    if (!item) return null;

                    return (
                      <div
                        key={url}
                        className="relative w-20 shrink-0 rounded-xl border border-white/10 bg-black/40 p-1.5"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-[#1a1a1a]">
                          {item.type === "video" ? (
                            <video
                              src={item.url}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={item.label}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#93f8b6] text-[10px] font-bold text-black">
                            {index + 1}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() =>
                              setSelectedOrder((prev) =>
                                moveSelectedItem(prev, index, -1),
                              )
                            }
                            className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                            aria-label="Sola taşı"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === selectedOrder.length - 1}
                            onClick={() =>
                              setSelectedOrder((prev) =>
                                moveSelectedItem(prev, index, 1),
                              )
                            }
                            className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                            aria-label="Sağa taşı"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">
                {selectedOrder.length > 0
                  ? `${selectedOrder.length} medya seçildi`
                  : "Eklemek için medya seçin"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={selectedOrder.length === 0}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Galeriye ekle
                </button>
              </div>
            </div>
          </motion.div>

          {previewVideo ? (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4"
              onClick={() => setPreviewVideo(null)}
            >
              <div
                className="relative w-full max-w-2xl"
                onClick={(event) => event.stopPropagation()}
              >
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
                  className="max-h-[70vh] w-full rounded-2xl bg-black"
                />
              </div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
