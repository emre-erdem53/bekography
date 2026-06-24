"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { RequestStatus } from "@prisma/client";
import { StatusSelect } from "@/components/admin/status-select";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type RequestItem = {
  id: string;
  publicId: string;
  customerName: string;
  customerPhone: string;
  city: string;
  shootDate: string;
  status: RequestStatus;
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

export function RequestsAdminClient() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { labels: paymentLabels } = usePaymentTypeCopy();

  function formatPackages(request: RequestItem) {
    return request.items
      .map(
        (item) =>
          `${item.packageOption.category.title} - ${item.packageOption.label} (${paymentLabels[item.paymentType]})`,
      )
      .join(", ");
  }

  useEffect(() => {
    fetch("/api/admin/requests")
      .then((res) => res.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: RequestStatus) {
    const response = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      if (status === "iptal") {
        setRequests((prev) => prev.filter((item) => item.id !== id));
      } else {
        setRequests((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        );
      }
    }
  }

  const statusOptions = Object.entries(REQUEST_STATUS_LABELS).map(
    ([value, label]) => ({
      value: value as RequestStatus,
      label,
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Talepler</h1>
        <p className="mt-1 text-sm text-zinc-400">Müşteri taleplerini yönetin</p>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : requests.length === 0 ? (
        <p className="text-zinc-500">Henüz talep yok.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{request.customerName}</p>
                    <p className="text-xs text-zinc-500">
                      {request.customerPhone && request.customerPhone !== "—"
                        ? request.customerPhone
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
                </dl>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">
                      <p>{request.customerName}</p>
                      <p className="text-xs text-zinc-500">
                      {request.customerPhone && request.customerPhone !== "—"
                        ? request.customerPhone
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
                      <StatusSelect
                        value={request.status}
                        options={statusOptions}
                        onChange={(status) => updateStatus(request.id, status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {request.status === "onaylandi" &&
                        !request.reservation ? (
                          <Link
                            href={`/admin/rezervasyonlar/yeni?requestId=${request.id}`}
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200"
                          >
                            Rezervasyon Oluştur
                          </Link>
                        ) : null}
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
