"use client";

import { useEffect, useState } from "react";
import type { ReservationStatus } from "@prisma/client";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import { formatCoupleName, formatTurkishPhone } from "@/lib/reservation-utils";
import { ReservationItemWorkflowAdmin } from "@/components/admin/reservation-item-workflow-admin";
import { normalizeTrackingData } from "@/lib/normalize-tracking-data";
import type { TrackingData } from "@/lib/tracking-types";
import { parsePostShootSnapshot } from "@/lib/post-shoot";
import {
  emptyItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import { adminStageOptionsFromDefinitions } from "@/lib/tracking-workflow-dynamic";
import {
  getTrackingLinkExpiresAt,
  isTrackingLinkExpired,
  resolveReservationCompletedAt,
} from "@/lib/tracking-access";

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
  status: string;
  completedAt: string | null;
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
    shootType: {
      label: string;
      package: {
        title: string;
        serviceArea: { title: string; slug: string; accentColor: string };
      };
    };
  }[];
  installments: { id: string; amount: number; dueDate: string; paidAt: string | null }[];
  statusHistory: { status: string; changedAt: string }[];
};

export function ReservationDetailClient({
  reservationId,
}: {
  reservationId: string;
}) {
  const { labels: paymentLabels } = usePaymentTypeCopy();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [togglingInstallmentId, setTogglingInstallmentId] = useState<
    string | null
  >(null);

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

  async function copyLink() {
    if (!reservation) return;
    await navigator.clipboard.writeText(reservation.trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleInstallmentPaid(
    installmentId: string,
    currentlyPaid: boolean,
  ) {
    setTogglingInstallmentId(installmentId);
    try {
      const response = await fetch(
        `/api/admin/reservations/${reservationId}/installments/${installmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid: !currentlyPaid }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        window.alert(data.error ?? "Ödeme durumu güncellenemedi");
        return;
      }

      const updated = (await response.json()) as {
        id: string;
        paidAt: string | null;
      };

      setReservation((prev) =>
        prev
          ? {
              ...prev,
              installments: prev.installments.map((row) =>
                row.id === updated.id
                  ? { ...row, paidAt: updated.paidAt }
                  : row,
              ),
            }
          : prev,
      );
    } finally {
      setTogglingInstallmentId(null);
    }
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;
  if (!reservation) return <p className="text-red-400">Rezervasyon bulunamadı.</p>;

  const postShoot = parsePostShootSnapshot(reservation.postShoot);
  const coupleName = formatCoupleName(reservation.brideName, reservation.groomName);
  const isCompleted = reservation.status === "teslim_edildi";
  const completedAt = resolveReservationCompletedAt({
    status: reservation.status as ReservationStatus,
    completedAt: reservation.completedAt
      ? new Date(reservation.completedAt)
      : null,
    statusHistory: reservation.statusHistory.map((entry) => ({
      status: entry.status as ReservationStatus,
      changedAt: new Date(entry.changedAt),
    })),
  });
  const linkExpiresAt = getTrackingLinkExpiresAt(completedAt);
  const linkExpired = isTrackingLinkExpired(completedAt);

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
          {isCompleted ? (
            <p className="mt-1 text-sm text-emerald-400">
              Tamamlandı
              {completedAt
                ? ` · ${format(completedAt, "d MMMM yyyy", { locale: tr })}`
                : ""}
            </p>
          ) : null}
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
                itemTitle={[
                  item.serviceAreaTitle,
                  item.packageTitle,
                  item.shootTypeLabel,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                postShoot={trackingData.postShoot}
                workflow={item.workflow}
                hasPrinting={item.hasPrinting}
                stageDefinitions={item.stageDefinitions}
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

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all text-sm text-zinc-400 sm:truncate">
            {reservation.trackingUrl}
          </p>
          <button
            type="button"
            onClick={copyLink}
            disabled={linkExpired}
            className="w-full shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {copied ? "Kopyalandı!" : "Takip Linkini Kopyala"}
          </button>
        </div>
        {isCompleted && linkExpiresAt ? (
          <p
            className={`mt-3 text-sm ${
              linkExpired ? "text-amber-300" : "text-zinc-500"
            }`}
          >
            {linkExpired
              ? `Müşteri linki ${format(linkExpiresAt, "d MMMM yyyy", { locale: tr })} tarihinde devre dışı kaldı.`
              : `Müşteri linki ${format(linkExpiresAt, "d MMMM yyyy", { locale: tr })} tarihine kadar aktif.`}
          </p>
        ) : null}
      </div>

      <Section title="Müşteri Bilgileri">
        <div className="grid-safe grid gap-4 md:grid-cols-2">
          <Info label="Damat" value={reservation.groomName} />
          <Info label="Damat TC" value={reservation.groomTc || "—"} />
          <Info label="Damat Tel" value={formatTurkishPhone(reservation.groomPhone)} />
          <div />
          <Info label="Gelin" value={reservation.brideName} />
          <Info label="Gelin TC" value={reservation.brideTc || "—"} />
          <Info label="Gelin Tel" value={formatTurkishPhone(reservation.bridePhone)} />
          {reservation.notes ? <Info label="Notlar" value={reservation.notes} /> : null}
        </div>
      </Section>

      <Section title="Çekim Hizmeti">
        <div className="space-y-3">
          {reservation.items.map((item, index) => (
            <div
              key={item.id ?? index}
              className="rounded-xl border border-white/10 p-4"
              style={{
                borderColor: `${item.shootType.package.serviceArea.accentColor}55`,
              }}
            >
              <h3
                className="font-semibold"
                style={{ color: item.shootType.package.serviceArea.accentColor }}
              >
                {item.shootType.package.serviceArea.title} ·{" "}
                {item.shootType.package.title} — {item.shootContent}
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

      <Section title="Süreç Etiketleri">
        <div className="space-y-4">
          {(trackingData?.items ?? []).map((trackingItem) => {
            const reservationItem = reservation.items.find(
              (item) => item.id === trackingItem.id,
            );
            if (!reservationItem) return null;

            const stageTags =
              postShoot.itemStageTags?.[trackingItem.id] ??
              trackingItem.workflowStageTags ??
              emptyItemWorkflowStageTags();
            const stages = trackingItem.stageDefinitions?.length
              ? adminStageOptionsFromDefinitions(trackingItem.stageDefinitions)
              : Object.keys(stageTags).map((id) => ({ id, label: id }));

            return (
              <div
                key={trackingItem.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
                style={{
                  borderColor: `${reservationItem.shootType.package.serviceArea.accentColor}55`,
                }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{
                    color:
                      reservationItem.shootType.package.serviceArea.accentColor,
                  }}
                >
                  {reservationItem.shootType.package.serviceArea.title} ·{" "}
                  {reservationItem.shootContent}
                </h3>
                <div className="mt-3 space-y-3">
                  {stages.map((stage) => {
                    const tags = stageTags[stage.id] ?? [];
                    if (tags.length === 0) return null;
                    return (
                      <PostShootTagsReadOnly
                        key={stage.id}
                        title={stage.label}
                        tags={tags}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!trackingData?.items.length ? (
            <p className="text-sm text-zinc-500">Süreç etiketleri yüklenemedi.</p>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Etiketleri düzenlemek için{" "}
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
          {reservation.installments.map((row) => {
            const isPaid = Boolean(row.paidAt);

            return (
              <li
                key={row.id}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleInstallmentPaid(row.id, isPaid)}
                  disabled={togglingInstallmentId === row.id}
                  aria-label={
                    isPaid ? "Ödeme alındı işaretini kaldır" : "Ödeme alındı işaretle"
                  }
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
                    isPaid
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                      : "border-white/15 bg-black/40 text-zinc-500 hover:border-white/30 hover:text-zinc-300"
                  }`}
                >
                  {isPaid ? <Check className="h-4 w-4" strokeWidth={2.5} /> : null}
                </button>
                <span className="min-w-0 flex-1 text-zinc-300">
                  {format(new Date(row.dueDate), "d MMMM yyyy", { locale: tr })}
                </span>
                <span
                  className={`font-medium ${
                    isPaid ? "text-zinc-500" : "text-emerald-400"
                  }`}
                >
                  {formatPrice(row.amount)}
                </span>
              </li>
            );
          })}
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

function PostShootTagsReadOnly({
  title,
  tags,
}: {
  title: string;
  tags: string[];
}) {
  if (tags.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl bg-white/5 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((pill) => (
          <span
            key={pill}
            className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300"
          >
            {pill}
          </span>
        ))}
      </div>
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
