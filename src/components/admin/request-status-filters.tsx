"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RequestStatus } from "@prisma/client";
import { X } from "lucide-react";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import {
  REQUEST_ADMIN_FILTER_STATUSES,
  countRequestsByStatus,
} from "@/lib/request-admin-filters";

type RequestStatusFiltersProps = {
  requests: Array<{ status: RequestStatus; customerName: string }>;
  statusFilter: RequestStatus | null;
  nameQuery: string;
  onStatusFilterChange: (status: RequestStatus | null) => void;
  onNameQueryChange: (query: string) => void;
  onClearFilters: () => void;
};

export function RequestStatusFilters({
  requests,
  statusFilter,
  nameQuery,
  onStatusFilterChange,
  onNameQueryChange,
  onClearFilters,
}: RequestStatusFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const statusCounts = useMemo(
    () => countRequestsByStatus(requests),
    [requests],
  );

  const hasActiveFilters = statusFilter !== null || nameQuery.trim().length > 0;

  const focusChip = useCallback((index: number) => {
    const total = REQUEST_ADMIN_FILTER_STATUSES.length + 1;
    const next = ((index % total) + total) % total;
    chipRefs.current[next]?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key === "Escape" && hasActiveFilters) {
        event.preventDefault();
        onClearFilters();
        return;
      }

      if (event.key === "/" && !isTypingField) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasActiveFilters, onClearFilters]);

  return (
    <section
      aria-label="Talep filtreleri"
      className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-white">Duruma göre filtrele</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Kutucuğa tıklayın veya odaklandıktan sonra ok tuşlarıyla gezinin. Arama
            için <kbd className="rounded border border-white/10 px-1">/</kbd>
          </p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Filtreyi kaldır
          </button>
        ) : null}
      </div>

      <div
        role="toolbar"
        aria-label="Talep durumu filtreleri"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
      >
        <button
          ref={(node) => {
            chipRefs.current[0] = node;
          }}
          type="button"
          onClick={() => onStatusFilterChange(null)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              focusChip(1);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              focusChip(REQUEST_ADMIN_FILTER_STATUSES.length);
            }
          }}
          className={`rounded-xl border px-3 py-3 text-left transition-colors ${
            statusFilter === null
              ? "border-white bg-white text-black"
              : "border-white/10 bg-black/40 text-white hover:border-white/25"
          }`}
        >
          <span className="block text-[11px] font-medium uppercase tracking-wide opacity-70">
            Tümü
          </span>
          <span className="mt-1 block text-2xl font-semibold tabular-nums">
            {requests.length}
          </span>
        </button>

        {REQUEST_ADMIN_FILTER_STATUSES.map((status, index) => {
          const chipIndex = index + 1;
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              ref={(node) => {
                chipRefs.current[chipIndex] = node;
              }}
              type="button"
              onClick={() => onStatusFilterChange(isActive ? null : status)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  focusChip(chipIndex + 1);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  focusChip(chipIndex - 1);
                }
              }}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                isActive
                  ? "border-[#93f8b6] bg-[#93f8b6]/15 text-white"
                  : "border-white/10 bg-black/40 text-white hover:border-white/25"
              }`}
            >
              <span className="block text-[11px] font-medium leading-snug text-zinc-400">
                {REQUEST_STATUS_LABELS[status]}
              </span>
              <span className="mt-1 block text-2xl font-semibold tabular-nums text-white">
                {statusCounts[status]}
              </span>
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-400">
          Müşteri adı
        </span>
        <input
          ref={searchRef}
          type="search"
          value={nameQuery}
          onChange={(event) => onNameQueryChange(event.target.value)}
          placeholder="Ad veya soyad yazın..."
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
        />
      </label>
    </section>
  );
}
