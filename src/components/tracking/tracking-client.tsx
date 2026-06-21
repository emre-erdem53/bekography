"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check } from "lucide-react";
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_ORDER } from "@/lib/constants";
import { normalizeTcKimlik } from "@/lib/reservations";

type TrackingData = {
  customerName: string;
  city: string;
  shootDate: string;
  statusLabel: string;
  timeline: { status: string; label: string; isCurrent: boolean }[];
  items: { categoryTitle: string; optionLabel: string; paymentType: string }[];
};

function trackingStorageKey(slug: string) {
  return `bekography-takip:${slug}`;
}

export function TrackingClient({ slug }: { slug: string }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tc, setTc] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem(trackingStorageKey(slug));
    if (!cached) {
      setLoading(false);
      return;
    }

    try {
      setData(JSON.parse(cached) as TrackingData);
      setVerified(true);
    } catch {
      sessionStorage.removeItem(trackingStorageKey(slug));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const normalized = normalizeTcKimlik(tc);
    if (normalized.length !== 11) {
      setError("TC kimlik numarası 11 haneli olmalıdır");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/track/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tc: normalized }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "TC kimlik numarası doğrulanamadı",
        );
        return;
      }

      setData(payload as TrackingData);
      setVerified(true);
      sessionStorage.setItem(trackingStorageKey(slug), JSON.stringify(payload));
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-black text-zinc-400">
        Yükleniyor...
      </main>
    );
  }

  if (notFound) {
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

  if (!verified || !data) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-black px-4 py-12 text-white">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Bekography
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Rezervasyon Takibi</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Sürecinizi görüntülemek için gelin veya damat TC kimlik numarasından
            birini girin.
          </p>

          <form onSubmit={handleVerify} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="tracking-tc"
                className="mb-2 block text-sm text-zinc-300"
              >
                TC Kimlik Numarası
              </label>
              <input
                id="tracking-tc"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                value={tc}
                onChange={(event) =>
                  setTc(normalizeTcKimlik(event.target.value).slice(0, 11))
                }
                placeholder="11 haneli TC kimlik no"
                className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-lg tracking-[0.2em] text-white outline-none focus:border-white/30"
              />
            </div>

            {error ? (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || tc.length !== 11}
              className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition enabled:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Doğrulanıyor..." : "Takibi Görüntüle"}
            </button>
          </form>
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
