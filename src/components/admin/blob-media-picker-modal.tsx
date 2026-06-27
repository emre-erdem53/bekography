"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ImageIcon, Loader2, Video, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { PackageGalleryMedia } from "@/lib/package-seed-data";

type BlobMediaItem = {
  url: string;
  pathname: string;
  uploadedAt: string;
  type: "image" | "video";
  label: string;
};

type BlobMediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (items: PackageGalleryMedia[]) => void;
  existingUrls?: string[];
  title?: string;
};

export function BlobMediaPickerModal({
  open,
  onClose,
  onSelect,
  existingUrls = [],
  title = "Medya Kütüphanesi",
}: BlobMediaPickerModalProps) {
  const [items, setItems] = useState<BlobMediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const existingSet = new Set(existingUrls);

  const fetchPage = useCallback(async (pageOffset: number, append: boolean) => {
    const response = await fetch(
      `/api/admin/blob-media?limit=20&offset=${pageOffset}`,
    );
    if (!response.ok) {
      throw new Error("Medya listesi alınamadı");
    }
    const data = (await response.json()) as {
      items: BlobMediaItem[];
      hasMore: boolean;
      nextOffset: number | null;
    };
    setItems((prev) => (append ? [...prev, ...data.items] : data.items));
    setHasMore(data.hasMore);
    setOffset(data.nextOffset ?? pageOffset + data.items.length);
  }, []);

  useEffect(() => {
    if (!open) return;

    setSelected(new Set());
    setItems([]);
    setOffset(0);
    setError("");
    setLoading(true);

    fetchPage(0, false)
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Medya listesi alınamadı",
        );
      })
      .finally(() => setLoading(false));
  }, [open, fetchPage]);

  function toggleItem(url: string) {
    if (existingSet.has(url)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function handleConfirm() {
    const chosen = items.filter((item) => selected.has(item.url));
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
      await fetchPage(offset, true);
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
                  Blob&apos;a daha önce yüklediğiniz görseller ve videolar. En
                  yeni yükleme en üstte.
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
              ) : items.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  Blob&apos;da görsel veya video bulunamadı.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => {
                    const isExisting = existingSet.has(item.url);
                    const isSelected = selected.has(item.url);
                    return (
                      <button
                        key={item.url}
                        type="button"
                        disabled={isExisting}
                        onClick={() => toggleItem(item.url)}
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
                              loading="lazy"
                            />
                          )}
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white">
                            {item.type === "video" ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <ImageIcon className="h-3 w-3" />
                            )}
                            {item.type === "video" ? "Video" : "Görsel"}
                          </span>
                          {isSelected ? (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#93f8b6] text-black">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : null}
                          {isExisting ? (
                            <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/80 px-2 py-1 text-center text-[10px] text-zinc-300">
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
                      </button>
                    );
                  })}
                </div>
              )}

              {hasMore && !loading ? (
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

            <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-400">
                {selected.size > 0
                  ? `${selected.size} medya seçildi`
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
                  disabled={selected.size === 0}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Galeriye ekle
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
