"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, ArrowLeft, Pencil } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { TrackingOrderView } from "@/components/tracking/tracking-order-view";
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
  const [data] = useState(initialData);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const trackingData = normalizeTrackingData(data);

  async function handleDownloadPdf() {
    if (!exportRef.current) return;

    setDownloading(true);
    setError("");

    try {
      await document.fonts.ready;

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#000000",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(
        `${slugifyFileName(data.coupleName) || "rezervasyon"}-siparis-formu.pdf`,
      );
    } catch {
      setError("PDF oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <div className="fixed bottom-6 right-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:right-6 sm:flex-row sm:items-center">
        <Link
          href={`/admin/rezervasyonlar/${reservationId}/duzenle`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
        >
          <Pencil className="h-4 w-4" />
          Düzenle
        </Link>
        <Link
          href={`/admin/rezervasyonlar/${reservationId}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/90 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Rezervasyon Detayı
        </Link>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? "İndiriliyor..." : "PDF İndir"}
        </button>
      </div>

      {error ? (
        <p className="fixed bottom-24 right-4 z-[70] rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <TrackingOrderView data={trackingData} exportRef={exportRef} />
    </div>
  );
}
