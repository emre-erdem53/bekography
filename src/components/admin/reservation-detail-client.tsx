"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ReservationStatus } from "@prisma/client";
import { StatusSelect } from "@/components/admin/status-select";
import { changeReservationStatus } from "@/components/admin/reservation-status-actions";
import {
  RESERVATION_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import { formatCoupleName } from "@/lib/reservation-utils";
import { ReservationItemWorkflowAdmin } from "@/components/admin/reservation-item-workflow-admin";
import { normalizeTrackingData } from "@/lib/normalize-tracking-data";
import type { TrackingData } from "@/lib/tracking-types";
import { isOutdoorCategory, parsePostShootSnapshot } from "@/lib/post-shoot";

type ReservationDetail = {
  id: string;
  trackingSlug: string;
  trackingUrl: string;
  brideName: string;
  brideTc: string;
  bridePhone: string;
  groomName: string;
  groomTc: string;
  groomPhone: string;
  totalPrice: number;
  cancellationFeeMax: number;
  discountAmount: number;
  discountEnabled?: boolean;
  postShoot: unknown;
  status: ReservationStatus;
  notes: string | null;
  items: {
    id: string;
    paymentType: "pesin" | "taksitli";
    unitPrice: number;
    shootDate: string;
    shootContent: string;
    readyTime: string;
    location: string;
    agreedUnitPrice: number;
    departureTime: string | null;
    arrivalTime: string | null;
    startTime: string | null;
    endTime: string | null;
    packageOption: {
      label: string;
      category: { title: string; slug: string; accentColor: string };
    };
  }[];
  installments: { amount: number; dueDate: string }[];
  statusHistory: { status: ReservationStatus; changedAt: string }[];
};

export function ReservationDetailClient({
  reservationId,
}: {
  reservationId: string;
}) {
  const router = useRouter();
  const { labels: paymentLabels } = usePaymentTypeCopy();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/reservations/${reservationId}`).then((res) => res.json()),
      fetch(`/api/admin/reservations/${reservationId}/tracking`).then((res) =>
        res.ok ? res.json() : null,
      ),
    ])
      .then(([reservationData, trackingPayload]) => {
        setReservation(reservationData);
        if (trackingPayload) {
          setTrackingData(normalizeTrackingData(trackingPayload));
        }
      })
      .finally(() => setLoading(false));
  }, [reservationId]);

  function handleWorkflowChange(postShoot: TrackingData["postShoot"]) {
    setTrackingData((prev) =>
      prev ? normalizeTrackingData({ ...prev, postShoot }) : prev,
    );
    setReservation((prev) =>
      prev ? { ...prev, postShoot } : prev,
    );
  }

  async function updateStatus(status: ReservationStatus) {
    if (!reservation) return;

    const result = await changeReservationStatus(
      reservationId,
      status,
      reservation.status,
    );
    if (!result) return;

    if (result.kind === "delivered") {
      router.push("/admin/rezervasyonlar/gecmis");
      return;
    }

    if (result.kind !== "updated") return;

    setReservation((prev) =>
      prev
        ? {
            ...prev,
            status: result.status,
            statusHistory: [
              ...prev.statusHistory,
              { status: result.status, changedAt: new Date().toISOString() },
            ],
          }
        : prev,
    );
  }

  async function copyLink() {
    if (!reservation) return;
    await navigator.clipboard.writeText(reservation.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;
  if (!reservation) return <p className="text-red-400">Rezervasyon bulunamadı.</p>;

  const statusOptions = Object.entries(RESERVATION_STATUS_LABELS).map(
    ([value, label]) => ({
      value: value as ReservationStatus,
      label,
    }),
  );

  const postShoot = parsePostShootSnapshot(reservation.postShoot);
  const coupleName = formatCoupleName(reservation.brideName, reservation.groomName);
  const showPrinting = reservation.items.some((item) =>
    isOutdoorCategory(item.packageOption.category.slug, {}),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/rezervasyonlar"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Rezervasyonlar
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{coupleName}</h1>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/admin/rezervasyonlar/${reservationId}/ozet`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
            Müşteri Önizlemesi
          </Link>
          <Link
            href={`/admin/rezervasyonlar/${reservationId}/duzenle`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
            Düzenle
          </Link>
          <StatusSelect
            value={reservation.status}
            options={statusOptions}
            onChange={updateStatus}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">Sipariş süreci</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Her paketin aşamasını müşteri takip ekranıyla aynı seçeneklerden
          yönetin.
        </p>
        {trackingData ? (
          <div className="mt-4 space-y-3">
            {trackingData.items.map((item) => (
              <ReservationItemWorkflowAdmin
                key={item.id}
                reservationId={reservationId}
                itemId={item.id}
                itemTitle={`${item.categoryTitle} · ${item.shootTypeLabel}`}
                postShoot={trackingData.postShoot}
                workflow={item.workflow}
                hasPrinting={item.isOutdoor}
                onWorkflowChange={handleWorkflowChange}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            Süreç bilgisi yüklenemedi.
          </p>
        )}
        <Link
          href={`/admin/rezervasyonlar/${reservationId}/ozet`}
          className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
        >
          Müşteri önizlemesini aç
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 break-all text-sm text-zinc-400 sm:truncate">
          {reservation.trackingUrl}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="w-full shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black sm:w-auto"
        >
          {copied ? "Kopyalandı!" : "Takip Linkini Kopyala"}
        </button>
      </div>

      <Section title="Müşteri Bilgileri">
        <div className="grid-safe grid gap-4 md:grid-cols-2">
          <Info label="Damat" value={reservation.groomName} />
          <Info label="Damat TC" value={reservation.groomTc || "—"} />
          <Info label="Damat Tel" value={reservation.groomPhone} />
          <div />
          <Info label="Gelin" value={reservation.brideName} />
          <Info label="Gelin TC" value={reservation.brideTc || "—"} />
          <Info label="Gelin Tel" value={reservation.bridePhone} />
          {reservation.notes ? <Info label="Notlar" value={reservation.notes} /> : null}
        </div>
      </Section>

      <Section title="Çekim Hizmeti">
        <div className="space-y-3">
          {reservation.items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/10 p-4"
              style={{ borderColor: `${item.packageOption.category.accentColor}55` }}
            >
              <h3
                className="font-semibold"
                style={{ color: item.packageOption.category.accentColor }}
              >
                {item.packageOption.category.title} — {item.shootContent}
              </h3>
              <div className="mt-3 grid-safe grid gap-2 text-sm md:grid-cols-2">
                <p className="text-zinc-400">
                  Çekim:{" "}
                  <span className="text-white">
                    {format(new Date(item.shootDate), "d MMMM yyyy", { locale: tr })}
                  </span>
                </p>
                <p className="text-zinc-400">
                  Fiyat:{" "}
                  <span className="text-white">
                    {formatPrice(item.agreedUnitPrice)} (
                    {paymentLabels[item.paymentType]})
                  </span>
                </p>
                {item.readyTime ? (
                  <p className="text-zinc-400">
                    Hazır: <span className="text-white">{item.readyTime}</span>
                  </p>
                ) : null}
                {item.location ? (
                  <p className="text-zinc-400">
                    Lokasyon: <span className="text-white">{item.location}</span>
                  </p>
                ) : null}
                {item.departureTime && item.arrivalTime ? (
                  <p className="text-zinc-400">
                    Rize:{" "}
                    <span className="text-white">
                      {item.departureTime} — {item.arrivalTime}
                    </span>
                  </p>
                ) : null}
                {item.startTime && item.endTime ? (
                  <p className="text-zinc-400">
                    Saat:{" "}
                    <span className="text-white">
                      {item.startTime} — {item.endTime}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Çekim Sonrası">
        <PostShootSectionReadOnly title="Dijital" section={postShoot.digital} />
        <PostShootSectionReadOnly title="Düzenleme" section={postShoot.editing} />
        {showPrinting ? (
          <PostShootSectionReadOnly title="Baskı" section={postShoot.printing} />
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          Metinleri düzenlemek için{" "}
          <Link
            href={`/admin/rezervasyonlar/${reservationId}/duzenle`}
            className="text-zinc-300 underline hover:text-white"
          >
            rezervasyon düzenleme
          </Link>{" "}
          ekranını kullanın.
        </p>
      </Section>

      <Section title="Ödeme Planı">
        <div
          className={`grid-safe grid gap-4 ${
            reservation.discountEnabled ?? reservation.discountAmount > 0
              ? "md:grid-cols-3"
              : "md:grid-cols-2"
          }`}
        >
          <Info label="Toplam Fiyat" value={formatPrice(reservation.totalPrice)} />
          <Info
            label="Cayma Bedeli Maks."
            value={formatPrice(reservation.cancellationFeeMax)}
          />
          {reservation.discountEnabled ?? reservation.discountAmount > 0 ? (
            <Info label="İndirim" value={formatPrice(reservation.discountAmount)} />
          ) : null}
        </div>
        <ul className="mt-4 space-y-2">
          {reservation.installments.map((row, index) => (
            <li
              key={index}
              className="flex justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
            >
              <span className="text-zinc-300">
                {format(new Date(row.dueDate), "d MMMM yyyy", { locale: tr })}
              </span>
              <span className="text-white">{formatPrice(row.amount)}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Durum Geçmişi">
        <ul className="space-y-2">
          {reservation.statusHistory.map((entry, index) => (
            <li key={index} className="flex justify-between text-sm text-zinc-400">
              <span>{RESERVATION_STATUS_LABELS[entry.status]}</span>
              <span>
                {format(new Date(entry.changedAt), "d MMM yyyy HH:mm", {
                  locale: tr,
                })}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function PostShootSectionReadOnly({
  title,
  section,
}: {
  title: string;
  section: { pills: string[]; description: string };
}) {
  if (!section.description.trim() && section.pills.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl bg-white/5 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      {section.pills.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {section.pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300"
            >
              {pill}
            </span>
          ))}
        </div>
      ) : null}
      {section.description ? (
        <p className="mt-2 text-sm text-zinc-400">{section.description}</p>
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
