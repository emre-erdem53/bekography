"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Pencil, ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { TrackingOrderView } from "@/components/tracking/tracking-order-view";
import { ReservationItemWorkflowAdmin } from "@/components/admin/reservation-item-workflow-admin";
import { normalizeTrackingData } from "@/lib/normalize-tracking-data";
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
  data: initialData,
}: {
  reservationId: string;
  data: TrackingData;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState(initialData);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const trackingData = normalizeTrackingData(data);

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

  function handleWorkflowChange(postShoot: TrackingData["postShoot"]) {
    setData((prev) => normalizeTrackingData({ ...prev, postShoot }));
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <div className="fixed bottom-6 right-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:right-6 sm:flex-row sm:items-center">
        <Link
          href="/admin/rezervasyonlar"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Liste
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

      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-24 sm:px-6 md:px-8">
        <section className="mb-8 space-y-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
          <div>
            <h1 className="text-lg font-semibold text-white">Paket Süreçleri</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Her paketin aşamasını müşteri takip ekranıyla aynı seçeneklerden
              yönetin.
            </p>
          </div>
          <div className="space-y-3">
            {trackingData.items.map((item) => (
              <ReservationItemWorkflowAdmin
                key={item.id}
                reservationId={reservationId}
                itemId={item.id}
                itemTitle={`${item.categoryTitle} · ${item.shootTypeLabel}`}
                postShoot={trackingData.postShoot}
                workflow={item.workflow}
                onWorkflowChange={handleWorkflowChange}
              />
            ))}
          </div>
        </section>
      </div>

      <TrackingOrderView data={trackingData} exportRef={exportRef} />
    </div>
  );
}
