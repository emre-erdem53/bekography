"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronDown, Trash2 } from "lucide-react";
import { ReservationStatusFilters } from "@/components/admin/reservation-status-filters";
import {
  deleteReservation,
  restoreReservation,
} from "@/components/admin/reservation-status-actions";
import { matchesReservationNameQuery } from "@/lib/reservation-admin-filters";
import {
  formatReservationListLocation,
  formatReservationListShootDate,
  getReservationListPackageSegments,
  getReservationListStageSegments,
  reservationMatchesWorkflowStage,
  type ReservationListColoredSegment,
} from "@/lib/reservation-list";
import { getCurrentReservationYear } from "@/lib/reservation-year";
import type { TrackingWorkflowStageId } from "@/lib/tracking-workflow";

type ReservationItem = {
  id: string;
  shootDate: string;
  location: string;
  productSnapshot: unknown;
  packageOption: {
    label: string;
    category: { title: string; accentColor?: string };
  };
};

type Reservation = {
  id: string;
  brideName: string;
  groomName: string;
  postShoot: unknown;
  deletedAt: string | null;
  items: ReservationItem[];
};

type YearOption = {
  year: number;
  count: number;
};

type ReservationsAdminClientProps = {
  view?: "active" | "past" | "deleted";
};

export function ReservationsAdminClient({
  view = "active",
}: ReservationsAdminClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPast = view === "past";
  const isDeleted = view === "deleted";
  const currentYear = getCurrentReservationYear();
  const selectedYear = isPast || isDeleted
    ? currentYear
    : Number(searchParams.get("year")) || currentYear;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [yearOptions, setYearOptions] = useState<YearOption[]>([
    { year: currentYear, count: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<TrackingWorkflowStageId | null>(
    null,
  );
  const [nameQuery, setNameQuery] = useState("");

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (
        stageFilter &&
        !reservationMatchesWorkflowStage(reservation, stageFilter)
      ) {
        return false;
      }
      return matchesReservationNameQuery(
        reservation.brideName,
        reservation.groomName,
        nameQuery,
      );
    });
  }, [reservations, stageFilter, nameQuery]);

  useEffect(() => {
    setLoading(true);
    setStageFilter(null);
    setNameQuery("");
    const params = new URLSearchParams({ view });
    if (!isPast && !isDeleted) {
      params.set("year", String(selectedYear));
    }
    fetch(`/api/admin/reservations?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReservations(data);
          return;
        }
        setReservations(data.reservations ?? []);
        if (Array.isArray(data.yearOptions)) {
          const options = data.yearOptions as YearOption[];
          if (!options.some((option) => option.year === selectedYear)) {
            setYearOptions([
              ...options,
              { year: selectedYear, count: data.reservations?.length ?? 0 },
            ].sort((a, b) => b.year - a.year));
          } else {
            setYearOptions(options);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [view, selectedYear, isPast, isDeleted]);

  function handleYearChange(year: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (year === currentYear) {
      params.delete("year");
    } else {
      params.set("year", String(year));
    }
    const query = params.toString();
    router.push(query ? `/admin/rezervasyonlar?${query}` : "/admin/rezervasyonlar");
  }

  const selectedYearCount =
    yearOptions.find((option) => option.year === selectedYear)?.count ??
    reservations.length;

  async function handleDelete(id: string) {
    const deleted = await deleteReservation(id);
    if (!deleted) return;
    setReservations((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleRestore(id: string) {
    const restored = await restoreReservation(id);
    if (!restored) return;
    setReservations((prev) => prev.filter((item) => item.id !== id));
  }

  const detailHref = (id: string) => `/admin/rezervasyonlar/${id}`;

  const pageTitle = isDeleted
    ? "Silinen Rezervasyonlar"
    : isPast
      ? "Geçmiş Rezervasyonlar"
      : "Rezervasyonlar";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isPast || isDeleted ? (
            <Link
              href="/admin/rezervasyonlar"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Rezervasyonlar
            </Link>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {pageTitle}
            </h1>
            {!isPast && !isDeleted ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(event) =>
                      handleYearChange(Number(event.target.value))
                    }
                    aria-label="Rezervasyon yılı"
                    className="appearance-none rounded-xl border border-white/10 bg-[#141414] py-1.5 pl-3 pr-8 text-sm font-medium text-white outline-none focus:border-white/30"
                  >
                    {yearOptions.map((option) => (
                      <option key={option.year} value={option.year}>
                        {option.year} ({option.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-300">
                  {selectedYearCount} rezervasyon
                </span>
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {isDeleted
              ? "Silinen rezervasyonları 30 gün içinde geri getirebilirsiniz"
              : isPast
                ? "Teslim edilmiş rezervasyonları görüntüleyin"
                : selectedYear < currentYear
                  ? `${selectedYear} yılına ait tüm rezervasyonlar`
                  : "Aktif rezervasyonları yönetin"}
          </p>
        </div>
        {!isPast && !isDeleted ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href="/admin/rezervasyonlar/silinenler"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5 sm:w-auto"
            >
              Silinenler
            </Link>
            <Link
              href="/admin/rezervasyonlar/gecmis"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5 sm:w-auto"
            >
              Geçmiş
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

      {!isPast && !isDeleted && !loading && reservations.length > 0 ? (
        <ReservationStatusFilters
          reservations={reservations}
          stageFilter={stageFilter}
          nameQuery={nameQuery}
          onStageFilterChange={setStageFilter}
          onNameQueryChange={setNameQuery}
          onClearFilters={() => {
            setStageFilter(null);
            setNameQuery("");
          }}
        />
      ) : null}

      {(isPast || isDeleted) && !loading && reservations.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">
              Gelin veya damat adı
            </span>
            <input
              type="search"
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
              placeholder="Ad veya soyad yazın..."
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
            />
          </label>
        </section>
      ) : null}

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : reservations.length === 0 ? (
        <p className="text-zinc-400">
          {isDeleted
            ? "Silinen rezervasyon yok."
            : isPast
              ? "Henüz teslim edilmiş rezervasyon yok."
              : selectedYear < currentYear
                ? `${selectedYear} yılı için rezervasyon bulunmuyor.`
                : "Aktif rezervasyon bulunmuyor."}
        </p>
      ) : filteredReservations.length === 0 ? (
        <p className="text-zinc-400">
          Seçili filtreye uygun rezervasyon bulunamadı.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredReservations.map((reservation) => (
              <article
                key={reservation.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(detailHref(reservation.id))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(detailHref(reservation.id));
                  }
                }}
                className="cursor-pointer rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 transition-colors hover:border-white/20"
              >
                <CoupleNames
                  brideName={reservation.brideName}
                  groomName={reservation.groomName}
                />
                <dl className="mt-4 space-y-2 text-sm">
                  <Row
                    label="Tarih"
                    value={formatReservationListShootDate(reservation.items)}
                  />
                  <Row
                    label="Paket"
                    value={
                      <ColoredSegments
                        segments={getReservationListPackageSegments(
                          reservation.items,
                        )}
                        separator=", "
                      />
                    }
                  />
                  <Row
                    label="Çekim Yeri"
                    value={formatReservationListLocation(reservation.items)}
                  />
                  <Row
                    label="Aşama"
                    value={
                      <ColoredSegments
                        segments={getReservationListStageSegments(reservation)}
                        separator=" · "
                      />
                    }
                  />
                  {isDeleted && reservation.deletedAt ? (
                    <Row
                      label="Silinme"
                      value={format(
                        new Date(reservation.deletedAt),
                        "d MMM yyyy HH:mm",
                        { locale: tr },
                      )}
                    />
                  ) : null}
                </dl>
                {!isDeleted ? (
                  <div
                    className="mt-4 flex gap-4 border-t border-white/5 pt-4 text-sm"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {!isPast ? (
                      <>
                        <Link
                          href={detailHref(reservation.id)}
                          className="font-medium text-white hover:text-zinc-200"
                        >
                          Özet
                        </Link>
                        <Link
                          href={`/admin/rezervasyonlar/${reservation.id}/duzenle`}
                          className="text-zinc-400 hover:text-white"
                        >
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(reservation.id)}
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          Sil
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div
                    className="mt-4 border-t border-white/5 pt-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleRestore(reservation.id)}
                      className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      Geri Getir
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#0f0f0f] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Çift</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Paket · Tür</th>
                  <th className="px-4 py-3 font-medium">Çekim Yeri</th>
                  <th className="px-4 py-3 font-medium">Aşama</th>
                  {isDeleted ? (
                    <th className="px-4 py-3 font-medium">Silinme</th>
                  ) : null}
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                    onClick={() => router.push(detailHref(reservation.id))}
                  >
                    <td className="px-4 py-3">
                      <CoupleNames
                        brideName={reservation.brideName}
                        groomName={reservation.groomName}
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatReservationListShootDate(reservation.items)}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <ColoredSegments
                        segments={getReservationListPackageSegments(
                          reservation.items,
                        )}
                        separator=", "
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {formatReservationListLocation(reservation.items)}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <ColoredSegments
                        segments={getReservationListStageSegments(reservation)}
                        separator=" · "
                      />
                    </td>
                    {isDeleted ? (
                      <td className="px-4 py-3 text-zinc-400">
                        {reservation.deletedAt
                          ? format(
                              new Date(reservation.deletedAt),
                              "d MMM yyyy",
                              { locale: tr },
                            )
                          : "—"}
                      </td>
                    ) : null}
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(reservation.id)}
                          className="text-emerald-300 hover:text-emerald-200"
                        >
                          Geri Getir
                        </button>
                      ) : !isPast ? (
                        <div className="flex items-center gap-3">
                          <Link
                            href={detailHref(reservation.id)}
                            className="font-medium text-white hover:text-zinc-200"
                          >
                            Özet
                          </Link>
                          <Link
                            href={`/admin/rezervasyonlar/${reservation.id}/duzenle`}
                            className="text-zinc-400 hover:text-white"
                          >
                            Düzenle
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(reservation.id)}
                            className="text-red-400 hover:text-red-300"
                            aria-label="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
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

function CoupleNames({
  brideName,
  groomName,
}: {
  brideName: string;
  groomName: string;
}) {
  return (
    <div className="text-white">
      <p>{brideName}</p>
      <p className="text-zinc-400">{groomName}</p>
    </div>
  );
}

function ColoredSegments({
  segments,
  separator,
}: {
  segments: ReservationListColoredSegment[];
  separator: string;
}) {
  if (segments.length === 0) {
    return <span className="text-zinc-300">—</span>;
  }

  return (
    <>
      {segments.map((segment, index) => (
        <span key={`${segment.text}-${index}`}>
          {index > 0 ? (
            <span className="text-zinc-500">{separator}</span>
          ) : null}
          <span style={{ color: segment.color }}>{segment.text}</span>
        </span>
      ))}
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-300">{value}</dd>
    </div>
  );
}
