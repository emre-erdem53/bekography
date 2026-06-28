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
                      {isPaid ? "Ödendi" : "Ödenecek"}{" "}
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
      <h1 className="font-couple text-4xl italic leading-none text-white sm:text-5xl md:text-6xl">
        {coupleTitle}
      </h1>

      <div className="mt-8 w-full space-y-3">
        <ContactPersonBar
          iconSrc="/groom.svg"
          name={formatPersonDisplayName(data.groomName)}
          phone={formatTurkishPhone(data.groomPhone)}
          tc={data.groomTc}
        />
        <ContactPersonBar
          iconSrc="/bride.svg"
          name={formatPersonDisplayName(data.brideName)}
          phone={formatTurkishPhone(data.bridePhone)}
          tc={data.brideTc}
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
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-white/15 bg-[#0a0a0a] px-5 py-4 text-sm sm:gap-x-8 sm:px-6">
      <span className="inline-flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 p-1.5">
          <img
            src={iconSrc}
            alt=""
            className="h-full w-full object-contain brightness-0 invert"
          />
        </span>
        <span className="truncate font-medium tracking-wide text-zinc-200">
          {name}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-zinc-400">
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{phone}</span>
      </span>
      {tc ? (
        <span className="inline-flex items-center gap-1.5 text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="tracking-wide">{tc}</span>
        </span>
      ) : null}
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
      <div className="relative flex items-center justify-center gap-3">
        <h3
          className="text-center text-2xl font-semibold leading-none sm:text-3xl md:text-4xl"
          style={{ color: item.accentColor }}
        >
          {item.categoryTitle}
        </h3>
        {item.workflowFlags.deliveredAt ? (
          <span className="absolute right-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 sm:static sm:px-3 sm:text-xs">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Teslim Edildi
          </span>
        ) : null}
      </div>

      <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
        <div className="-mx-1 rounded-xl bg-white/[0.04] px-4 py-5 sm:px-5">
          {item.isOutdoor ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:gap-x-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.55fr)_minmax(0,0.75fr)_minmax(0,0.75fr)] md:gap-x-10 md:gap-y-0">
              <ShootMetaBlock label="Çekim Günü" value={shootDayLabel} size="lg" />
              <ShootMetaBlock
                label="Çekim İçeriği"
                value={shootContentLabel}
                size="lg"
                nowrap
              />
              <ShootMetaBlock
                label="Rize'den Çıkış"
                value={item.departureTime || "—"}
                size="lg"
              />
              <ShootMetaBlock
                label="Rize'ye Varış"
                value={item.arrivalTime || "—"}
                size="lg"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:gap-x-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.55fr)_minmax(0,0.75fr)_minmax(0,0.75fr)] md:gap-x-10 md:gap-y-0">
              <ShootMetaBlock label="Çekim Günü" value={shootDayLabel} size="lg" />
              <ShootMetaBlock
                label="Çekim İçeriği"
                value={shootContentLabel}
                size="lg"
                nowrap
              />
              <ShootMetaBlock label="Başlangıç" value={item.startTime || "—"} size="lg" />
              <ShootMetaBlock label="Bitiş" value={item.endTime || "—"} size="lg" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:gap-x-8 md:grid-cols-3 md:gap-x-10">
          <ShootMetaBlock
            label="Hazır Olma Saati"
            value={readyTimeLabel}
            size="sm"
            valueClassName="text-xs font-medium text-zinc-500 sm:text-sm md:text-base"
          />
          <ShootMetaBlock
            label="Çekim Yeri"
            value={locationLabel}
            size="sm"
            valueClassName="text-xs font-medium text-zinc-500 sm:text-sm md:text-base"
          />
          <ShootMetaBlock
            label="B. Fiyat"
            value={formatPrice(item.agreedUnitPrice)}
            size="sm"
            valueClassName="text-xs font-medium text-zinc-500 sm:text-sm md:text-base"
          />
        </div>
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
  nowrap = false,
  size = "lg",
  valueClassName,
}: {
  label: string;
  value: string;
  nowrap?: boolean;
  size?: "lg" | "sm";
  valueClassName?: string;
}) {
  const labelSize =
    size === "sm"
      ? "text-[9px] sm:text-[10px] md:text-xs"
      : "text-[10px] sm:text-xs md:text-sm";
  const defaultValueSize =
    size === "sm"
      ? "text-xs sm:text-sm md:text-base"
      : "text-sm sm:text-xl md:text-2xl";

  return (
    <div className="min-w-0 pr-1 last:pr-0">
      <p
        className={`font-medium uppercase leading-snug tracking-wide text-zinc-500 ${labelSize}`}
      >
        {label}
      </p>
      <p
        className={`mt-1.5 font-semibold leading-snug text-white sm:mt-2 ${valueClassName ?? defaultValueSize} ${
          nowrap ? "whitespace-nowrap" : ""
        }`}
      >
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
