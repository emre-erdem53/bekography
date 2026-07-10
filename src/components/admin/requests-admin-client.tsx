"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { RequestStatus } from "@prisma/client";
import { ChevronDown, Trash2 } from "lucide-react";
import { StatusSelect } from "@/components/admin/status-select";
import { RequestStatusFilters } from "@/components/admin/request-status-filters";
import {
  deleteRequest,
  restoreRequest,
} from "@/components/admin/request-status-actions";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { buildAdminListHref } from "@/lib/admin-list-navigation";
import { formatTurkishPhone } from "@/lib/reservation-utils";
import {
  matchesRequestNameQuery,
  requestMatchesStatusFilter,
} from "@/lib/request-admin-filters";
import { getCurrentReservationYear } from "@/lib/reservation-year";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type RequestItem = {
  id: string;
  publicId: string;
  customerName: string;
  customerPhone: string;
  city: string;
  shootDate: string;
  status: RequestStatus;
  deletedAt: string | null;
  createdAt: string;
  items: {
    paymentType: "pesin" | "taksitli";
    packageOption: {
      label: string;
      category: { title: string };
    };
  }[];
  reservation: { id: string } | null;
};

type YearOption = {
  year: number;
  count: number;
};

function getRequestListSurfaceClass(request: RequestItem): string {
  if (request.deletedAt) {
    return "border-red-500/25 bg-red-500/10";
  }
  if (request.status === "onaylandi") {
    return "border-emerald-500/25 bg-emerald-500/10";
  }
  if (request.status === "iptal") {
    return "border-red-500/25 bg-red-500/10";
  }
  return "border-white/10 bg-[#0f0f0f]";
}

export function RequestsAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = getCurrentReservationYear();
  const selectedYear = Number(searchParams.get("year")) || currentYear;
  const showDeletedView = searchParams.get("view") === "silinenler";
  const { labels: paymentLabels } = usePaymentTypeCopy();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [yearOptions, setYearOptions] = useState<YearOption[]>([
    { year: currentYear, count: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | null>(null);
  const [nameQuery, setNameQuery] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (
        !showDeletedView &&
        !requestMatchesStatusFilter(request, statusFilter)
      ) {
        return false;
      }
      return matchesRequestNameQuery(request.customerName, nameQuery);
    });
  }, [requests, statusFilter, nameQuery, showDeletedView]);

  useEffect(() => {
    setLoading(true);
    setStatusFilter(null);
    setNameQuery("");
    const params = new URLSearchParams({ year: String(selectedYear) });
    if (showDeletedView) {
      params.set("view", "silinenler");
    }
    fetch(`/api/admin/requests?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
          return;
        }
        setRequests(data.requests ?? []);
        if (Array.isArray(data.yearOptions)) {
          const options = data.yearOptions as YearOption[];
          if (!options.some((option) => option.year === selectedYear)) {
            setYearOptions(
              [
                ...options,
                { year: selectedYear, count: data.requests?.length ?? 0 },
              ].sort((a, b) => b.year - a.year),
            );
          } else {
            setYearOptions(options);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [selectedYear, showDeletedView]);

  function handleYearChange(year: number) {
    const href = buildAdminListHref("/admin/talepler", {
      year,
      view: showDeletedView ? "silinenler" : undefined,
      currentYear,
    });
    router.push(href);
  }

  const deletedViewHref = buildAdminListHref("/admin/talepler", {
    year: selectedYear,
    view: "silinenler",
    currentYear,
  });
  const activeViewHref = buildAdminListHref("/admin/talepler", {
    year: selectedYear,
    currentYear,
  });

  const selectedYearCount =
    yearOptions.find((option) => option.year === selectedYear)?.count ??
    requests.length;

  function formatPackages(request: RequestItem) {
    return request.items
      .map(
        (item) =>
          `${item.packageOption.category.title} - ${item.packageOption.label} (${paymentLabels[item.paymentType]})`,
      )
      .join(", ");
  }

  async function updateStatus(id: string, status: RequestStatus) {
    const response = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      setRequests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    }
  }

  async function handleDelete(id: string) {
    const deleted = await deleteRequest(id);
    if (!deleted) return;
    setRequests((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleRestore(id: string) {
    const restored = await restoreRequest(id);
    if (!restored) return;
    setRequests((prev) => prev.filter((item) => item.id !== id));
  }

  const statusOptions = Object.entries(REQUEST_STATUS_LABELS).map(
    ([value, label]) => ({
      value: value as RequestStatus,
      label,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {showDeletedView ? "Silinen Talepler" : "Talepler"}
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(event) =>
                    handleYearChange(Number(event.target.value))
                  }
                  aria-label="Talep yılı"
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
                {selectedYearCount}{" "}
                {showDeletedView ? "silinen talep" : "talep"}
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {showDeletedView
              ? "Silinen talepleri görüntüleyin ve geri getirin"
              : selectedYear < currentYear
                ? `${selectedYear} yılına ait aktif talepler`
                : "Müşteri taleplerini yönetin"}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {showDeletedView ? (
            <Link
              href={activeViewHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
            >
              Aktif Liste
            </Link>
          ) : (
            <Link
              href={deletedViewHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
            >
              Silinenler
            </Link>
          )}
        </div>
      </div>

      {!loading && requests.length > 0 && !showDeletedView ? (
        <RequestStatusFilters
          requests={requests}
          statusFilter={statusFilter}
          nameQuery={nameQuery}
          onStatusFilterChange={setStatusFilter}
          onNameQueryChange={setNameQuery}
          onClearFilters={() => {
            setStatusFilter(null);
            setNameQuery("");
          }}
        />
      ) : null}

      {!loading && requests.length > 0 && showDeletedView ? (
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-400">
            Müşteri adı
          </span>
          <input
            type="search"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder="Ad veya soyad yazın..."
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
          />
        </label>
      ) : null}

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : requests.length === 0 ? (
        <p className="text-zinc-500">
          {showDeletedView
            ? "Silinen talep bulunmuyor."
            : selectedYear < currentYear
              ? `${selectedYear} yılı için talep bulunmuyor.`
              : "Henüz talep yok."}
        </p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-zinc-400">Seçili filtreye uygun talep bulunamadı.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                className={`rounded-2xl border p-4 ${getRequestListSurfaceClass(request)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{request.customerName}</p>
                    <p className="text-xs text-zinc-500">
                      {request.customerPhone && request.customerPhone !== "—"
                        ? formatTurkishPhone(request.customerPhone)
                        : "—"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/talepler/${request.id}`}
                    className="shrink-0 text-sm text-zinc-400 hover:text-white"
                  >
                    Detay →
                  </Link>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Tarih</dt>
                    <dd className="text-right text-zinc-300">
                      {format(new Date(request.shootDate), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Şehir</dt>
                    <dd className="text-right text-zinc-300">{request.city}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Paketler</dt>
                    <dd className="mt-1 text-zinc-400">{formatPackages(request)}</dd>
                  </div>
                  {request.deletedAt ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500">Silinme</dt>
                      <dd className="text-right text-zinc-300">
                        {format(new Date(request.deletedAt), "d MMM yyyy HH:mm", {
                          locale: tr,
                        })}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {showDeletedView ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(request.id)}
                      className="text-emerald-300 hover:text-emerald-200"
                    >
                      Geri Getir
                    </button>
                  ) : (
                    <>
                      <StatusSelect
                        value={request.status}
                        options={statusOptions}
                        onChange={(status) => updateStatus(request.id, status)}
                      />
                      {request.status === "onaylandi" && !request.reservation ? (
                        <Link
                          href={`/admin/rezervasyonlar/yeni?requestId=${request.id}`}
                          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                        >
                          Rezervasyon Oluştur
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(request.id)}
                        className="inline-flex items-center gap-1 self-start text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#0f0f0f] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Şehir</th>
                  <th className="px-4 py-3 font-medium">Paketler</th>
                  <th className="px-4 py-3 font-medium">
                    {showDeletedView ? "Silinme" : "Durum"}
                  </th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className={`border-t border-white/5 ${getRequestListSurfaceClass(request)}`}
                  >
                    <td className="px-4 py-3 text-white">
                      <p>{request.customerName}</p>
                      <p className="text-xs text-zinc-500">
                        {request.customerPhone && request.customerPhone !== "—"
                          ? formatTurkishPhone(request.customerPhone)
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {format(new Date(request.shootDate), "d MMM yyyy", {
                        locale: tr,
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{request.city}</td>
                    <td className="max-w-xs px-4 py-3 text-zinc-400">
                      {formatPackages(request)}
                    </td>
                    <td className="px-4 py-3">
                      {showDeletedView ? (
                        <span className="text-zinc-400">
                          {request.deletedAt
                            ? format(new Date(request.deletedAt), "d MMM yyyy HH:mm", {
                                locale: tr,
                              })
                            : "—"}
                        </span>
                      ) : (
                        <StatusSelect
                          value={request.status}
                          options={statusOptions}
                          onChange={(status) => updateStatus(request.id, status)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {showDeletedView ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(request.id)}
                            className="text-emerald-300 hover:text-emerald-200"
                          >
                            Geri Getir
                          </button>
                        ) : (
                          <>
                            {request.status === "onaylandi" && !request.reservation ? (
                              <Link
                                href={`/admin/rezervasyonlar/yeni?requestId=${request.id}`}
                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200"
                              >
                                Rezervasyon Oluştur
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleDelete(request.id)}
                              className="text-red-400 hover:text-red-300"
                              aria-label="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <Link
                          href={`/admin/talepler/${request.id}`}
                          className="text-zinc-400 hover:text-white"
                        >
                          Detay
                        </Link>
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
