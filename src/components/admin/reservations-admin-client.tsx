"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ReservationStatus } from "@prisma/client";
import { StatusSelect } from "@/components/admin/status-select";
import { changeReservationStatus } from "@/components/admin/reservation-status-actions";
import {
  RESERVATION_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import { formatCoupleName } from "@/lib/reservations";

type ReservationItem = {
  shootDate: string;
};

type Reservation = {
  id: string;
  trackingSlug: string;
  brideName: string;
  groomName: string;
  totalPrice: number;
  status: ReservationStatus;
  items: ReservationItem[];
};

function formatShootDates(items: ReservationItem[]) {
  if (items.length === 0) return "—";
  const dates = [...items]
    .map((item) => item.shootDate)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (dates.length === 1) {
    return format(new Date(dates[0]), "d MMM yyyy", { locale: tr });
  }

  const first = format(new Date(dates[0]), "d MMM", { locale: tr });
  const last = format(new Date(dates[dates.length - 1]), "d MMM yyyy", {
    locale: tr,
  });
  return `${first} — ${last}`;
}

type ReservationsAdminClientProps = {
  view?: "active" | "past";
};

export function ReservationsAdminClient({
  view = "active",
}: ReservationsAdminClientProps) {
  const isPast = view === "past";
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reservations?view=${view}`)
      .then((res) => res.json())
      .then(setReservations)
      .finally(() => setLoading(false));
  }, [view]);

  async function updateStatus(id: string, status: ReservationStatus) {
    const current = reservations.find((item) => item.id === id)?.status;
    if (!current) return;

    const result = await changeReservationStatus(id, status, current);
    if (!result) return;

    if (result.kind === "delivered" || result.kind === "deleted") {
      setReservations((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    setReservations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: result.status } : item,
      ),
    );
  }

  const statusOptions = Object.entries(RESERVATION_STATUS_LABELS).map(
    ([value, label]) => ({
      value: value as ReservationStatus,
      label,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isPast ? (
            <Link
              href="/admin/rezervasyonlar"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Rezervasyonlar
            </Link>
          ) : null}
          <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {isPast ? "Geçmiş Rezervasyonlar" : "Rezervasyonlar"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isPast
              ? "Teslim edilmiş rezervasyonları görüntüleyin"
              : "Aktif rezervasyonları yönetin"}
          </p>
        </div>
        {!isPast ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href="/admin/rezervasyonlar/gecmis"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5 sm:w-auto"
            >
              Geçmiş Rezervasyonlar
            </Link>
            <Link
              href="/admin/rezervasyonlar/yeni"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black sm:w-auto"
            >
              Yeni Rezervasyon
            </Link>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : reservations.length === 0 ? (
        <p className="text-zinc-400">
          {isPast
            ? "Henüz teslim edilmiş rezervasyon yok."
            : "Aktif rezervasyon bulunmuyor."}
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {reservations.map((reservation) => (
              <article
                key={reservation.id}
                className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4"
              >
                <p className="font-medium text-white">
                  {formatCoupleName(reservation.brideName, reservation.groomName)}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Çekim Tarihleri</dt>
                    <dd className="text-right text-zinc-300">
                      {formatShootDates(reservation.items)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Tutar</dt>
                    <dd className="text-right text-zinc-300">
                      {formatPrice(reservation.totalPrice)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  {isPast ? (
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      {RESERVATION_STATUS_LABELS.teslim_edildi}
                    </span>
                  ) : (
                    <StatusSelect
                      value={reservation.status}
                      options={statusOptions}
                      onChange={(status) => updateStatus(reservation.id, status)}
                    />
                  )}
                </div>
                <div className="mt-4 flex gap-4 border-t border-white/5 pt-4 text-sm">
                  <Link
                    href={`/admin/rezervasyonlar/${reservation.id}`}
                    className="text-zinc-400 hover:text-white"
                  >
                    Detay
                  </Link>
                  {!isPast ? (
                    <Link
                      href={`/admin/rezervasyonlar/${reservation.id}/duzenle`}
                      className="text-zinc-400 hover:text-white"
                    >
                      Düzenle
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#0f0f0f] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Çift</th>
                  <th className="px-4 py-3 font-medium">Çekim Tarihleri</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">
                      {formatCoupleName(
                        reservation.brideName,
                        reservation.groomName,
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatShootDates(reservation.items)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatPrice(reservation.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      {isPast ? (
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          {RESERVATION_STATUS_LABELS.teslim_edildi}
                        </span>
                      ) : (
                        <StatusSelect
                          value={reservation.status}
                          options={statusOptions}
                          onChange={(status) =>
                            updateStatus(reservation.id, status)
                          }
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/rezervasyonlar/${reservation.id}`}
                          className="text-zinc-400 hover:text-white"
                        >
                          Detay
                        </Link>
                        {!isPast ? (
                          <Link
                            href={`/admin/rezervasyonlar/${reservation.id}/duzenle`}
                            className="text-zinc-400 hover:text-white"
                          >
                            Düzenle
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
