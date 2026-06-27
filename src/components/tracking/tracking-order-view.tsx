"use client";

import { forwardRef, type Ref } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertTriangle, Camera, Check, Phone, ShieldCheck } from "lucide-react";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
  formatPrice,
} from "@/lib/constants";
import type { TrackingData } from "@/lib/tracking-types";
import { normalizeTrackingData } from "@/lib/normalize-tracking-data";
import {
  firstNameFromFullName,
  formatPersonDisplayName,
  formatTurkishPhone,
} from "@/lib/reservation-utils";
import { TrackingWorkflowTimeline } from "@/components/tracking/tracking-workflow-timeline";
import { TrackingPurchasedProducts } from "@/components/tracking/tracking-purchased-products";

import { CANCELLATION_POLICY } from "@/lib/cancellation-fee";

export const TRACKING_PAGE_TOP = "pt-28 md:pt-32";

export function TrackingPageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`flex-1 bg-black px-4 pb-16 text-white md:px-8 ${TRACKING_PAGE_TOP} ${className}`}
    >
      {children}
    </main>
  );
}

export const ReservationOrderDocument = forwardRef<
  HTMLDivElement,
  { data: TrackingData; showCoupleHeader?: boolean; sectionsTagsOnly?: boolean }
>(function ReservationOrderDocument(
  { data, showCoupleHeader = true, sectionsTagsOnly = false },
  ref,
) {
  return (
    <div ref={ref} className="mx-auto max-w-5xl">
      {showCoupleHeader ? (
        <CoupleOrderHeader data={data} />
      ) : null}

      <section className={showCoupleHeader ? "mt-10" : "mt-0"}>
        <SectionHeading icon={Camera}>Çekim Hizmeti</SectionHeading>
        <div className="mt-5 space-y-4">
          {data.items.map((item) => (
            <ShootServiceCard key={item.id || item.categoryTitle} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Ödeme Planı</SectionHeading>
        <div className="mt-5 rounded-2xl border border-white/15 bg-[#0a0a0a]">
          <div
            className={`grid grid-cols-1 border-b border-white/10 ${
              data.discountEnabled ? "md:grid-cols-3" : "md:grid-cols-2"
            }`}
          >
            <PaymentSummaryCell
              label="Toplam Fiyat"
              value={formatPrice(data.totalPrice)}
            />
            <PaymentSummaryCell
              label="Cayma Bedeli"
              value={formatPrice(data.cancellationFeeMax)}
            />
            {data.discountEnabled ? (
              <PaymentSummaryCell
                label="İndirim"
                value={formatPrice(data.discountAmount)}
              />
            ) : null}
          </div>
          {data.installments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.installments.map((row, index) => {
                const isPaid = Boolean(row.paidAt);

                return (
                  <div
                    key={index}
                    className="border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-b-0"
                  >
                    <p className="text-xs text-zinc-500">
                      Ödenecek{" "}
                      {format(new Date(row.dueDate), "d MMMM yyyy", {
                        locale: tr,
                      })}
                    </p>
                    <p
                      className={`mt-2 text-xl font-semibold sm:text-2xl ${
                        isPaid ? "text-zinc-500" : "text-emerald-400"
                      }`}
                    >
                      {formatPrice(row.amount)}
                    </p>
                    {isPaid ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        (Bu vadeye ait ödeme tamamlandı)
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-4 text-sm text-zinc-500">
              Ödeme vadesi tanımlanmamış.
            </p>
          )}
        </div>
      </section>

      <TrackingPurchasedProducts
        products={data.purchasedProducts}
        sectionsTagsOnly={sectionsTagsOnly}
      />

      <div className="mt-8 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100/90">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p>{CANCELLATION_POLICY}</p>
      </div>
    </div>
  );
});

export function TrackingProcessSection({ data }: { data: TrackingData }) {
  const currentIndex = RESERVATION_STATUS_ORDER.findIndex(
    (status) => status === data.timeline.find((step) => step.isCurrent)?.status,
  );

  return (
    <section className="mx-auto mt-12 max-w-5xl border-t border-white/10 pt-10">
      <SectionHeading>Süreç Takibi</SectionHeading>
      <p className="mt-2 text-sm text-zinc-400">
        Rezervasyonunuzun güncel aşamasını buradan takip edebilirsiniz.
      </p>
      <div className="mt-5 rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">Güncel durum</p>
          <p className="text-lg font-semibold text-amber-300">
            {data.statusLabel}
          </p>
        </div>
        <ol className="space-y-0">
          {RESERVATION_STATUS_ORDER.map((status, index) => {
            const step = data.timeline.find((entry) => entry.status === status);
            const isCompleted = step !== undefined;
            const isCurrent = step?.isCurrent ?? false;
            const isUpcoming = index > currentIndex;

            return (
              <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
                {index < RESERVATION_STATUS_ORDER.length - 1 ? (
                  <span
                    className={`absolute left-[11px] top-6 h-full w-px ${
                      isCompleted && !isCurrent ? "bg-white/70" : "bg-white/10"
                    }`}
                  />
                ) : null}
                <span
                  className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    isCurrent
                      ? "border-amber-300 bg-amber-300 text-black"
                      : isCompleted
                        ? "border-white bg-white text-black"
                        : "border-white/20 bg-transparent"
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <span className="h-2 w-2 rounded-full bg-black" />
                  ) : null}
                </span>
                <p
                  className={`pt-0.5 font-medium ${
                    isUpcoming ? "text-zinc-600" : "text-white"
                  }`}
                >
                  {step?.label ?? RESERVATION_STATUS_LABELS[status]}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function CustomerTrackingView({ data }: { data: TrackingData }) {
  return (
    <TrackingPageShell>
      <TrackingOrderBody data={data} />
    </TrackingPageShell>
  );
}

export function TrackingOrderView({
  data,
  exportRef,
  sectionsTagsOnly = false,
}: {
  data: TrackingData;
  exportRef?: Ref<HTMLDivElement>;
  sectionsTagsOnly?: boolean;
}) {
  return (
    <TrackingPageShell>
      <TrackingOrderBody
        data={data}
        exportRef={exportRef}
        sectionsTagsOnly={sectionsTagsOnly}
      />
    </TrackingPageShell>
  );
}

function TrackingOrderBody({
  data,
  exportRef,
  sectionsTagsOnly = false,
}: {
  data: TrackingData;
  exportRef?: Ref<HTMLDivElement>;
  sectionsTagsOnly?: boolean;
}) {
  const trackingData = normalizeTrackingData(data);

  return (
    <div ref={exportRef} className="mx-auto max-w-5xl">
      <CoupleOrderHeader data={trackingData} />
      <ReservationOrderDocument
        data={trackingData}
        showCoupleHeader={false}
        sectionsTagsOnly={sectionsTagsOnly}
      />
    </div>
  );
}

function CoupleOrderHeader({ data }: { data: TrackingData }) {
  const coupleTitle = `${firstNameFromFullName(data.brideName)} & ${firstNameFromFullName(data.groomName)}`;

  return (
    <header className="pb-2 pt-2 text-center sm:pt-4">
      <h1 className="font-couple text-4xl leading-none text-white sm:text-5xl md:text-6xl">
        {coupleTitle}
      </h1>

      <div className="mt-8 w-full space-y-4">
        <ContactPersonBar
          iconSrc="/bride.svg"
          name={formatPersonDisplayName(data.brideName)}
          phone={formatTurkishPhone(data.bridePhone)}
          tc={data.brideTc}
        />
        <ContactPersonBar
          iconSrc="/groom.svg"
          name={formatPersonDisplayName(data.groomName)}
          phone={formatTurkishPhone(data.groomPhone)}
          tc={data.groomTc}
        />
      </div>
    </header>
  );
}

function ContactPersonBar({
  iconSrc,
  name,
  phone,
  tc,
}: {
  iconSrc: string;
  name: string;
  phone: string;
  tc: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-white/15 bg-[#0a0a0a] px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 p-1.5 sm:h-10 sm:w-10">
          <img
            src={iconSrc}
            alt=""
            className="h-full w-full object-contain brightness-0 invert"
          />
        </span>
        <p className="truncate text-sm font-medium tracking-wide text-zinc-200 sm:text-base">
          {name}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{phone}</span>
        </span>
        {tc ? (
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="tracking-wide">{tc}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeading({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (Icon) {
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-500" aria-hidden />
        <h2 className="text-sm font-medium text-zinc-400">{children}</h2>
      </div>
    );
  }

  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
      {children}
    </h2>
  );
}

function ShootServiceCard({ item }: { item: TrackingData["items"][number] }) {
  const shootDayLabel = format(new Date(item.shootDate), "d MMMM", {
    locale: tr,
  });
  const shootContentLabel =
    item.shootContent.trim() || item.shootTypeLabel || "—";
  const locationLabel = item.location.trim() || "Belirlenecek";
  const readyTimeLabel = item.readyTime.trim() || "Belirlenecek";

  return (
    <article className="rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
      <h3
        className="text-center text-2xl font-semibold leading-none sm:text-3xl md:text-4xl"
        style={{ color: item.accentColor }}
      >
        {item.categoryTitle}
      </h3>

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <ShootMetaBlock label="Hazır Olma Saati" value={readyTimeLabel} />
          <ShootMetaBlock label="Çekim Yeri" value={locationLabel} />
        </div>

        {item.isOutdoor ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ShootMetaBlock label="Çekim Günü" value={shootDayLabel} />
            <ShootMetaBlock label="Çekim İçeriği" value={shootContentLabel} />
            <ShootMetaBlock
              label="Rize'den Çıkış"
              value={item.departureTime || "—"}
            />
            <ShootMetaBlock
              label="Rize'ye Varış"
              value={item.arrivalTime || "—"}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ShootMetaBlock label="Çekim Günü" value={shootDayLabel} />
            <ShootMetaBlock label="Çekim İçeriği" value={shootContentLabel} />
            <ShootMetaBlock label="Başlangıç" value={item.startTime || "—"} />
            <ShootMetaBlock label="Bitiş" value={item.endTime || "—"} />
          </div>
        )}
      </div>

      {item.workflow ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Sipariş Durumu
          </p>
          <TrackingWorkflowTimeline
            workflow={item.workflow}
            stageTags={item.workflowStageTags}
            embedded
          />
        </div>
      ) : null}
    </article>
  );
}

function ShootMetaBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function PaymentSummaryCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-white/10 px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">{value}</p>
    </div>
  );
}
