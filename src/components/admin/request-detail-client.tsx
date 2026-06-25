"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { RequestStatus } from "@prisma/client";
import { StatusSelect } from "@/components/admin/status-select";
import {
  REQUEST_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type RequestDetail = {
  id: string;
  publicId: string;
  customerName: string;
  customerPhone: string;
  city: string;
  shootDate: string;
  status: RequestStatus;
  items: {
    paymentType: "pesin" | "taksitli";
    unitPrice: number;
    shootDate: string | null;
    city: string | null;
    packageOption: {
      id: string;
      label: string;
      category: { title: string };
    };
  }[];
  reservation: { id: string } | null;
};

export function RequestDetailClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { labels: paymentLabels } = usePaymentTypeCopy();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/requests/${requestId}`)
      .then((res) => res.json())
      .then(setRequest)
      .finally(() => setLoading(false));
  }, [requestId]);

  async function updateStatus(status: RequestStatus) {
    const response = await fetch(`/api/admin/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      if (status === "iptal") {
        router.push("/admin/talepler");
        return;
      }
      setRequest((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;
  if (!request) return <p className="text-red-400">Talep bulunamadı.</p>;

  const statusOptions = Object.entries(REQUEST_STATUS_LABELS).map(
    ([value, label]) => ({
      value: value as RequestStatus,
      label,
    }),
  );

  const total = request.items.reduce((sum, item) => sum + item.unitPrice, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/talepler" className="text-sm text-zinc-400 hover:text-white">
            ← Talepler
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            Talep #{request.publicId}
          </h1>
        </div>
        <StatusSelect
          value={request.status}
          options={statusOptions}
          onChange={updateStatus}
          className="sm:min-w-[10rem]"
        />
      </div>

      <div className="grid-safe grid gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 md:grid-cols-2">
        <Info label="İletişim" value={request.customerName} />
        <Info
          label="Telefon"
          value={
            request.customerPhone && request.customerPhone !== "—"
              ? request.customerPhone
              : "—"
          }
        />
        <Info label="Şehir" value={request.city} />
        <Info
          label="Çekim Tarihi"
          value={format(new Date(request.shootDate), "d MMMM yyyy", {
            locale: tr,
          })}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">Seçilen Paketler</h2>
        <ul className="mt-4 space-y-2">
          {request.items.map((item, index) => (
            <li
              key={index}
              className="rounded-xl bg-white/5 px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="text-zinc-300">
                  {item.packageOption.category.title} — {item.packageOption.label}{" "}
                  ({paymentLabels[item.paymentType]})
                </span>
                <span className="shrink-0 text-white">
                  {formatPrice(item.unitPrice)}
                </span>
              </div>
              {item.city || item.shootDate ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {item.city ? `Şehir: ${item.city}` : null}
                  {item.city && item.shootDate ? " · " : null}
                  {item.shootDate
                    ? `Tarih: ${format(new Date(item.shootDate), "d MMMM yyyy", {
                        locale: tr,
                      })}`
                    : null}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-lg font-semibold text-white">
          Toplam: {formatPrice(total)}
        </p>
      </div>

      {request.status === "onaylandi" && !request.reservation ? (
        <Link
          href={`/admin/rezervasyonlar/yeni?requestId=${request.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black sm:w-auto"
        >
          Rezervasyon Oluştur
        </Link>
      ) : request.reservation ? (
        <Link
          href={`/admin/rezervasyonlar/${request.reservation.id}`}
          className="inline-flex text-sm text-zinc-400 hover:text-white"
        >
          Rezervasyonu görüntüle →
        </Link>
      ) : null}
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
