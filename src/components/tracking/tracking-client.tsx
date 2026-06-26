"use client";

import { useEffect, useState } from "react";
import {
  CustomerTrackingView,
  TrackingPageShell,
} from "@/components/tracking/tracking-order-view";
import type { TrackingData } from "@/lib/tracking-types";
import { normalizeTrackingData } from "@/lib/normalize-tracking-data";
import { normalizeTcKimlik } from "@/lib/reservation-utils";

function trackingStorageKey(slug: string) {
  return `bekography-takip:v6:${slug}`;
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
      const parsed = JSON.parse(cached) as TrackingData;
      if (!parsed.coupleName || !Array.isArray(parsed.items)) {
        sessionStorage.removeItem(trackingStorageKey(slug));
        return;
      }
      setData(normalizeTrackingData(parsed));
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

      const payloadRaw = await response.json().catch(() => ({}));

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        setError(
          typeof payloadRaw.error === "string"
            ? payloadRaw.error
            : "TC kimlik numarası doğrulanamadı",
        );
        return;
      }

      const trackingData = normalizeTrackingData(payloadRaw as TrackingData);
      setData(trackingData);
      setVerified(true);
      sessionStorage.setItem(
        trackingStorageKey(slug),
        JSON.stringify(trackingData),
      );
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <TrackingPageShell className="flex min-h-[60vh] items-center justify-center text-zinc-400">
        Yükleniyor...
      </TrackingPageShell>
    );
  }

  if (notFound) {
    return (
      <TrackingPageShell className="flex min-h-[60vh] items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Rezervasyon bulunamadı
          </h1>
          <p className="mt-2 text-zinc-400">
            Bu takip linki geçersiz veya süresi dolmuş olabilir.
          </p>
        </div>
      </TrackingPageShell>
    );
  }

  if (!verified || !data) {
    return (
      <TrackingPageShell className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Bekography
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Rezervasyon Takibi</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Sipariş formunuzu görüntülemek için gelin veya damat TC kimlik
            numarasından birini girin.
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
              {submitting ? "Doğrulanıyor..." : "Formu Görüntüle"}
            </button>
          </form>
        </div>
      </TrackingPageShell>
    );
  }

  return <CustomerTrackingView data={data} />;
}
