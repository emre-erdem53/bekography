"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Pencil, ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { TrackingOrderView } from "@/components/tracking/tracking-order-view";
import type { TrackingData } from "@/lib/tracking-types";

function slugifyFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç&]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ReservationSummaryClient({
  reservationId,
  data,
}: {
  reservationId: string;
  data: TrackingData;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownloadPng() {
    if (!exportRef.current) return;

    setDownloading(true);
    setError("");

    try {
      await document.fonts.ready;

      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: "#000000",
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `${slugifyFileName(data.coupleName) || "rezervasyon"}-siparis-formu.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("PNG oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <div className="fixed bottom-6 right-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:right-6 sm:flex-row sm:items-center">
        <Link
          href={`/admin/rezervasyonlar/${reservationId}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Detay
        </Link>
        <Link
          href={`/admin/rezervasyonlar/${reservationId}/duzenle`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
        >
          <Pencil className="h-4 w-4" />
          Düzenle
        </Link>
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? "İndiriliyor..." : "PNG İndir"}
        </button>
      </div>

      {error ? (
        <p className="fixed bottom-24 right-4 z-[70] rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <TrackingOrderView data={data} exportRef={exportRef} />
    </div>
  );
}
