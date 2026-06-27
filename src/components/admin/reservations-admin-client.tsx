"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ReservationStatus } from "@prisma/client";
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
import { resolvePersonFirstName } from "@/lib/reservation-utils";
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
  brideFirstName?: string;
  groomName: string;
  groomFirstName?: string;
  status: ReservationStatus;
  postShoot: unknown;
  deletedAt: string | null;
  items: ReservationItem[];
};

type YearOption = {
  year: number;
  count: number;
};

function getReservationListSurfaceClass(reservation: Reservation): string {
  if (reservation.deletedAt) {
    return "border-red-500/25 bg-red-500/10 hover:border-red-500/35";
  }
  if (reservation.status === "teslim_edildi") {
    return "border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-500/35";
  }
  return "border-white/10 bg-[#0f0f0f] hover:border-white/20";
}

function isReservationManageable(reservation: Reservation): boolean {
  return !reservation.deletedAt && reservation.status !== "teslim_edildi";
}

export function ReservationsAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = getCurrentReservationYear();
  const selectedYear = Number(searchParams.get("year")) || currentYear;
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
        {
          brideName: reservation.brideName,
          brideFirstName: reservation.brideFirstName,
          groomName: reservation.groomName,
          groomFirstName: reservation.groomFirstName,
        },
        nameQuery,
      );
    });
  }, [reservations, stageFilter, nameQuery]);

  useEffect(() => {
    setLoading(true);
    setStageFilter(null);
    setNameQuery("");
    const params = new URLSearchParams({ year: String(selectedYear) });
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
            setYearOptions(
              [
                ...options,
                { year: selectedYear, count: data.reservations?.length ?? 0 },
              ].sort((a, b) => b.year - a.year),
            );
          } else {
            setYearOptions(options);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

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
    setReservations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, deletedAt: new Date().toISOString() }
          : item,
      ),
    );
  }

  async function handleRestore(id: string) {
    const restored = await restoreReservation(id);
    if (!restored) return;
    setReservations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, deletedAt: null } : item,
      ),
    );
  }

  const detailHref = (id: string) => `/admin/rezervasyonlar/${id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Rezervasyonlar
            </h1>
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
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {selectedYear < currentYear
              ? `${selectedYear} yılına ait tüm rezervasyonlar`
              : "Aktif, tamamlanan ve silinen rezervasyonları yönetin"}
          </p>
        </div>
        <Link
          href="/admin/rezervasyonlar/yeni"
          className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black sm:w-auto"
        >
          Yeni Rezervasyon
        </Link>
      </div>

      {!loading && reservations.length > 0 ? (
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

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : reservations.length === 0 ? (
        <p className="text-zinc-400">
          {selectedYear < currentYear
            ? `${selectedYear} yılı için rezervasyon bulunmuyor.`
            : "Rezervasyon bulunmuyor."}
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
                className={`cursor-pointer rounded-2xl border p-4 transition-colors ${getReservationListSurfaceClass(reservation)}`}
              >
                <CoupleNames
                  brideFirstName={reservation.brideFirstName}
                  brideName={reservation.brideName}
                  groomFirstName={reservation.groomFirstName}
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
                  {reservation.deletedAt ? (
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
                <div
                  className="mt-4 flex gap-4 border-t border-white/5 pt-4 text-sm"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Link
                    href={detailHref(reservation.id)}
                    className="font-medium text-white hover:text-zinc-200"
                  >
                    Özet
                  </Link>
                  {reservation.deletedAt ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(reservation.id)}
                      className="text-emerald-300 hover:text-emerald-200"
                    >
                      Geri Getir
                    </button>
                  ) : isReservationManageable(reservation) ? (
                    <>
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
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className={`cursor-pointer border-t border-white/5 transition-colors hover:brightness-110 ${getReservationListSurfaceClass(reservation)}`}
                    onClick={() => router.push(detailHref(reservation.id))}
                  >
                    <td className="px-4 py-3">
                      <CoupleNames
                        brideFirstName={reservation.brideFirstName}
                        brideName={reservation.brideName}
                        groomFirstName={reservation.groomFirstName}
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
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={detailHref(reservation.id)}
                          className="font-medium text-white hover:text-zinc-200"
                        >
                          Özet
                        </Link>
                        {reservation.deletedAt ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(reservation.id)}
                            className="text-emerald-300 hover:text-emerald-200"
                          >
                            Geri Getir
                          </button>
                        ) : isReservationManageable(reservation) ? (
                          <>
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
                          </>
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

function CoupleNames({
  brideFirstName,
  brideName,
  groomFirstName,
  groomName,
}: {
  brideFirstName?: string;
  brideName: string;
  groomFirstName?: string;
  groomName: string;
}) {
  const bride = resolvePersonFirstName(brideFirstName, brideName);
  const groom = resolvePersonFirstName(groomFirstName, groomName);

  return (
    <div className="text-white">
      <p>{bride}</p>
      <p className="text-zinc-400">{groom}</p>
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
