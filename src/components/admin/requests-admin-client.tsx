"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { RequestStatus } from "@prisma/client";
import { StatusSelect } from "@/components/admin/status-select";
import { REQUEST_STATUS_LABELS, PAYMENT_TYPE_LABELS } from "@/lib/constants";

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
      setRequests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
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
        <h1 className="text-2xl font-semibold text-white">Talepler</h1>
        <p className="mt-1 text-sm text-zinc-400">Müşteri taleplerini yönetin</p>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : requests.length === 0 ? (
        <p className="text-zinc-500">Henüz talep yok.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
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
                    <p className="text-xs text-zinc-500">{request.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {format(new Date(request.shootDate), "d MMM yyyy", {
                      locale: tr,
                    })}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{request.city}</td>
                  <td className="max-w-xs px-4 py-3 text-zinc-400">
                    {request.items
                      .map(
                        (item) =>
                          `${item.packageOption.category.title} - ${item.packageOption.label} (${PAYMENT_TYPE_LABELS[item.paymentType]})`,
                      )
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={request.status}
                      options={statusOptions}
                      onChange={(status) => updateStatus(request.id, status)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/talepler/${request.id}`}
                      className="text-zinc-400 hover:text-white"
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
