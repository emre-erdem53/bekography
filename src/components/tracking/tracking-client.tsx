"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check } from "lucide-react";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_ORDER } from "@/lib/constants";

type TrackingData = {
  customerName: string;
  city: string;
  shootDate: string;
  statusLabel: string;
  timeline: { status: string; label: string; isCurrent: boolean }[];
  items: { categoryTitle: string; optionLabel: string; paymentType: string }[];
};

export function TrackingClient({ slug }: { slug: string }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/track/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-black text-zinc-400">
        Yükleniyor...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-black px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Rezervasyon bulunamadı
          </h1>
          <p className="mt-2 text-zinc-400">
            Bu takip linki geçersiz veya süresi dolmuş olabilir.
          </p>
        </div>
      </main>
    );
  }

  const currentIndex = RESERVATION_STATUS_ORDER.findIndex(
    (status) => status === data.timeline.find((t) => t.isCurrent)?.status,
  );

  return (
    <main className="flex-1 bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Bekography
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Rezervasyon Takibi</h1>
        <p className="mt-2 text-zinc-400">
          Merhaba {data.customerName}, sürecinizi buradan takip edebilirsiniz.
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">Çekim Tarihi</p>
            <p className="mt-1 font-medium">
              {format(new Date(data.shootDate), "d MMMM yyyy", { locale: tr })}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Şehir</p>
            <p className="mt-1 font-medium">{data.city}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-zinc-500">Güncel Durum</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">
              {data.statusLabel}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="font-semibold">Süreç</h2>
          <ol className="mt-6 space-y-0">
            {RESERVATION_STATUS_ORDER.map((status, index) => {
              const step = data.timeline.find((t) => t.status === status);
              const isCompleted = step !== undefined;
              const isCurrent = step?.isCurrent ?? false;
              const isUpcoming = index > currentIndex;

              return (
                <li key={status} className="relative flex gap-4 pb-8 last:pb-0">
                  {index < RESERVATION_STATUS_ORDER.length - 1 ? (
                    <span
                      className={`absolute left-[11px] top-6 h-full w-px ${
                        isCompleted && !isCurrent
                          ? "bg-white"
                          : "bg-white/15"
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      isCurrent
                        ? "border-amber-300 bg-amber-300 text-black"
                        : isCompleted
                          ? "border-white bg-white text-black"
                          : "border-white/20 bg-transparent text-transparent"
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-black" />
                    ) : null}
                  </span>
                  <div>
                    <p
                      className={`font-medium ${
                        isUpcoming ? "text-zinc-600" : "text-white"
                      }`}
                    >
                      {step?.label ?? RESERVATION_STATUS_LABELS[status]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0a0a0a] p-5">
          <h2 className="font-semibold">Paketler</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {data.items.map((item, index) => (
              <li key={index}>
                {item.categoryTitle} — {item.optionLabel} ({item.paymentType})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
