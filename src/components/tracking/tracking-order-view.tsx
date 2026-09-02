"use client";

import { forwardRef, type Ref } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Camera, Check, Phone, ShieldCheck } from "lucide-react";
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
import { ReservationProductPdfDetail } from "@/components/tracking/reservation-product-pdf-detail";
import {
  ContractLinkButton,
  ContractPdfModal,
  useContractPdfModal,
} from "@/components/tracking/contract-pdf-modal";

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
  {
    data: TrackingData;
    showCoupleHeader?: boolean;
    sectionsTagsOnly?: boolean;
    includeProductDetails?: boolean;
    hideContractLink?: boolean;
  }
>(function ReservationOrderDocument(
  {
    data,
    showCoupleHeader = true,
    sectionsTagsOnly = false,
    includeProductDetails = false,
    hideContractLink = false,
  },
  ref,
) {
  const contractModal = useContractPdfModal();

  return (
    <>
      <div ref={ref} className="mx-auto max-w-5xl">
        {showCoupleHeader ? <CoupleOrderHeader data={data} /> : null}

        <section className={showCoupleHeader ? "mt-5" : "mt-0"}>
          <SectionHeading icon={Camera}>Çekim Hizmeti</SectionHeading>
          <div className="mt-2 space-y-4">
            {data.items.map((item) => (
              <ShootServiceCard key={item.id || item.serviceAreaTitle} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <SectionHeading>Ödeme Planı</SectionHeading>
          <div className="mt-5 rounded-2xl border border-white/15 bg-[#0a0a0a]">
            <div
              className={`grid grid-cols-2 border-b border-white/10 ${
                data.discountEnabled ? "md:grid-cols-3" : ""
              }`}
            >
              <PaymentSummaryCell
                label="Toplam Fiyat"
                value={formatPrice(data.totalPrice)}
                sublabel={data.paymentTypeLabel || undefined}
              />
              <PaymentSummaryCell
                label="Cayma Bedeli"
                value={formatPrice(data.cancellationFeeMax)}
                sublabel="Maksimum %75"
                sublabelMuted
              />
              {data.discountEnabled ? (
                <PaymentSummaryCell
                  label="İndirim"
                  value={formatPrice(data.discountAmount)}
                  className="col-span-2 md:col-span-1"
                />
              ) : null}
            </div>
            {data.installments.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.installments.map((row, index) => {
                  const isPaid = Boolean(row.paidAt);

                  return (
                    <div
                      key={index}
                      className="border-b border-r border-white/10 px-4 py-4 last:border-b-0 sm:px-5"
                    >
                      <p className="text-xs text-zinc-500">
                        {isPaid ? "Ödendi" : "Ödenecek"}
                      </p>
                      {!isPaid ? (
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {format(new Date(row.dueDate), "d MMMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {format(new Date(row.paidAt!), "d MMMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                      )}
                      <p
                        className={`mt-2 text-lg font-semibold sm:text-xl ${
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
          staticMode={includeProductDetails}
        />

        {includeProductDetails && data.purchasedProducts.length > 0 ? (
          <section className="mt-10">
            <SectionHeading>Ürün Detayları</SectionHeading>
            <div className="mt-5 space-y-8 sm:space-y-10">
              {data.purchasedProducts.map((product) => (
                <ReservationProductPdfDetail
                  key={product.shootTypeId}
                  product={product}
                />
              ))}
            </div>
          </section>
        ) : null}

        {hideContractLink ? null : (
          <ContractLinkButton onClick={contractModal.openModal} />
        )}
      </div>

      <ContractPdfModal open={contractModal.open} onClose={contractModal.closeModal} />
    </>
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
  includeProductDetails = false,
}: {
  data: TrackingData;
  exportRef?: Ref<HTMLDivElement>;
  sectionsTagsOnly?: boolean;
  includeProductDetails?: boolean;
}) {
  return (
    <TrackingPageShell>
      <TrackingOrderBody
        data={data}
        exportRef={exportRef}
        sectionsTagsOnly={sectionsTagsOnly}
        includeProductDetails={includeProductDetails}
      />
    </TrackingPageShell>
  );
}

function TrackingOrderBody({
  data,
  exportRef,
  sectionsTagsOnly = false,
  includeProductDetails = false,
}: {
  data: TrackingData;
  exportRef?: Ref<HTMLDivElement>;
  sectionsTagsOnly?: boolean;
  includeProductDetails?: boolean;
}) {
  const trackingData = normalizeTrackingData(data);

  return (
    <div ref={exportRef} className="mx-auto max-w-5xl">
      <CoupleOrderHeader data={trackingData} />
      <ReservationOrderDocument
        data={trackingData}
        showCoupleHeader={false}
        sectionsTagsOnly={sectionsTagsOnly}
        includeProductDetails={includeProductDetails}
        hideContractLink={includeProductDetails}
      />
    </div>
  );
}

function CoupleOrderHeader({ data }: { data: TrackingData }) {
  const coupleTitle = `${firstNameFromFullName(data.brideName)} & ${firstNameFromFullName(data.groomName)}`;

  return (
    <header className="pb-2 pt-2 text-center sm:pt-4">
      <h1 className="font-couple text-3xl italic leading-none text-white sm:text-4xl md:text-5xl">
        {coupleTitle}
      </h1>

      <div className="mt-5 w-full space-y-2">
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
    <div className="overflow-x-auto rounded-xl border border-white/15 bg-[#0a0a0a] px-3 py-2.5">
      <div className="flex min-w-max items-center justify-center gap-4 text-xs text-zinc-400 sm:gap-6">
        <span className="inline-flex shrink-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 p-1">
            <img
              src={iconSrc}
              alt=""
              className="h-full w-full object-contain brightness-0 invert"
            />
          </span>
          <span className="max-w-[8rem] truncate font-medium text-zinc-300 sm:max-w-none">
            {name}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <Phone className="h-3 w-3 shrink-0" aria-hidden />
          <span className="whitespace-nowrap">{phone}</span>
        </span>
        {tc ? (
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
            <span className="whitespace-nowrap tracking-wide">{tc}</span>
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
  const shootDateLabel = format(new Date(item.shootDate), "d MMMM yyyy", {
    locale: tr,
  });
  const shootContentLabel =
    item.shootContent.trim() || item.shootTypeLabel || "—";
  const locationLabel = item.location.trim() || "Belirlenecek";

  return (
    <article className="rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
      <div className="relative flex flex-col items-center gap-2">
        <h3
          className="text-center text-3xl font-bold leading-tight sm:text-4xl"
          style={{ color: item.accentColor }}
        >
          {item.serviceAreaTitle}
        </h3>
        {item.packageTitle ? (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
            {item.packageTitle}
          </p>
        ) : null}
        <p className="text-sm font-medium text-zinc-400">{shootDateLabel}</p>
        {item.workflowFlags.deliveredAt ? (
          <span className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 sm:static sm:px-3 sm:text-xs">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Teslim Edildi
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
        <div className="-mx-1 rounded-xl bg-white/[0.04] px-3 py-4 sm:px-4">
          {item.isOutdoor ? (
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-4">
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
              <ShootMetaBlock
                label="Çekim İçeriği"
                value={shootContentLabel}
                size="lg"
                nowrap
              />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-4">
              <ShootMetaBlock
                label="Başlangıç"
                value={item.startTime || "—"}
                size="lg"
              />
              <ShootMetaBlock
                label="Bitiş"
                value={item.endTime || "—"}
                size="lg"
              />
              <ShootMetaBlock
                label="Çekim İçeriği"
                value={shootContentLabel}
                size="lg"
                nowrap
              />
            </div>
          )}
        </div>

        <p className="text-sm text-zinc-400">
          <span className="text-zinc-500">Çekim Yeri:</span>{" "}
          <span className="font-medium text-zinc-300">{locationLabel}</span>
        </p>
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
      : "text-[9px] sm:text-[10px] md:text-xs";
  const defaultValueSize =
    size === "sm"
      ? "text-xs sm:text-sm md:text-base"
      : "text-xs sm:text-sm md:text-base";

  return (
    <div className="min-w-0">
      <p
        className={`font-medium uppercase leading-snug tracking-wide text-zinc-500 ${labelSize}`}
      >
        {label}
      </p>
      <p
        className={`mt-1 font-semibold leading-snug text-white sm:mt-1.5 ${valueClassName ?? defaultValueSize} ${
          nowrap ? "truncate" : "break-words"
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
  sublabel,
  sublabelMuted = false,
  className = "",
}: {
  label: string;
  value: string;
  sublabel?: string;
  sublabelMuted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`border-b border-white/10 px-4 py-4 last:border-b-0 sm:px-5 md:border-b-0 md:border-r md:last:border-r-0 ${className}`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white sm:text-xl">{value}</p>
      {sublabel ? (
        <p
          className={`mt-1 ${
            sublabelMuted
              ? "text-[10px] text-zinc-500"
              : "text-xs text-zinc-400"
          }`}
        >
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
