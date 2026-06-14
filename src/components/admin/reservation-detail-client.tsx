"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Pencil } from "lucide-react";
import type { ReservationStatus } from "@prisma/client";
import { StatusSelect } from "@/components/admin/status-select";
import {
  RESERVATION_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  formatPrice,
} from "@/lib/constants";

type ReservationDetail = {
  id: string;
  trackingSlug: string;
  trackingUrl: string;
  customerName: string;
  customerPhone: string;
  city: string;
  shootDate: string;
  agreedPrice: number;
  status: ReservationStatus;
  notes: string | null;
  items: {
    paymentType: "pesin" | "taksitli";
    unitPrice: number;
    packageOption: {
      label: string;
      category: { title: string };
    };
  }[];
  statusHistory: { status: ReservationStatus; changedAt: string }[];
};

export function ReservationDetailClient({
  reservationId,
}: {
  reservationId: string;
}) {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/reservations/${reservationId}`)
      .then((res) => res.json())
      .then(setReservation)
      .finally(() => setLoading(false));
  }, [reservationId]);

  async function updateStatus(status: ReservationStatus) {
    const response = await fetch(`/api/admin/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      const updated = await response.json();
      setReservation((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              statusHistory: [
                ...prev.statusHistory,
                { status: updated.status, changedAt: new Date().toISOString() },
              ],
            }
          : prev,
      );
    }
  }

  async function copyLink() {
    if (!reservation) return;
    await navigator.clipboard.writeText(reservation.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;
  if (!reservation) return <p className="text-red-400">Rezervasyon bulunamadı.</p>;

  const statusOptions = Object.entries(RESERVATION_STATUS_LABELS).map(
    ([value, label]) => ({
      value: value as ReservationStatus,
      label,
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/rezervasyonlar"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Rezervasyonlar
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {reservation.customerName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/rezervasyonlar/${reservationId}/duzenle`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
            <Pencil className="h-4 w-4" />
            Düzenle
          </Link>
          <StatusSelect
            value={reservation.status}
            options={statusOptions}
            onChange={updateStatus}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
        <p className="flex-1 truncate text-sm text-zinc-400">
          {reservation.trackingUrl}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          {copied ? "Kopyalandı!" : "Takip Linkini Kopyala"}
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 md:grid-cols-2">
        <Info label="Telefon" value={reservation.customerPhone} />
        <Info label="Şehir" value={reservation.city} />
        <Info
          label="Çekim Tarihi"
          value={format(new Date(reservation.shootDate), "d MMMM yyyy", {
            locale: tr,
          })}
        />
        <Info label="Anlaşılan Tutar" value={formatPrice(reservation.agreedPrice)} />
        {reservation.notes ? (
          <Info label="Notlar" value={reservation.notes} />
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">Paketler</h2>
        <ul className="mt-4 space-y-2">
          {reservation.items.map((item, index) => (
            <li
              key={index}
              className="flex justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
            >
              <span className="text-zinc-300">
                {item.packageOption.category.title} — {item.packageOption.label} (
                {PAYMENT_TYPE_LABELS[item.paymentType]})
              </span>
              <span className="text-white">{formatPrice(item.unitPrice)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">Durum Geçmişi</h2>
        <ul className="mt-4 space-y-2">
          {reservation.statusHistory.map((entry, index) => (
            <li key={index} className="flex justify-between text-sm text-zinc-400">
              <span>{RESERVATION_STATUS_LABELS[entry.status]}</span>
              <span>
                {format(new Date(entry.changedAt), "d MMM yyyy HH:mm", {
                  locale: tr,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-white">{value}</p>
    </div>
  );
}
