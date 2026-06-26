"use client";

import { forwardRef, type Ref } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertTriangle, Check } from "lucide-react";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
  formatPrice,
} from "@/lib/constants";
import type { PostShootSection } from "@/lib/post-shoot";
import type { TrackingData } from "@/lib/tracking-types";
import { normalizeTrackingData } from "@/lib/normalize-tracking-data";
import { TrackingWorkflowTimeline } from "@/components/tracking/tracking-workflow-timeline";
import { TrackingPurchasedProducts } from "@/components/tracking/tracking-purchased-products";

const CANCELLATION_POLICY =
  "30 günden fazla süre kalan bir çekimi iptal eden taraf karşı tarafa toplam ücretin %50'sini cayma bedeli olarak öder. 30 günden daha az bir süre varsa bu oran %75'tir. Sözleşmedeki mücbir sebeplerle iptal olursa oran %25'tir.";

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
  { data: TrackingData; showCoupleHeader?: boolean }
>(function ReservationOrderDocument({ data, showCoupleHeader = true }, ref) {
  const showPrinting = data.items.some((item) => item.isOutdoor);

  return (
    <div ref={ref} className="mx-auto max-w-5xl">
      {showCoupleHeader ? (
        <CoupleOrderHeader data={data} />
      ) : null}

      <section className={showCoupleHeader ? "mt-10" : "mt-0"}>
        <SectionHeading>Çekim Hizmeti</SectionHeading>
        <div className="mt-5 space-y-4">
          {data.items.map((item) => (
            <ShootServiceCard key={item.id || item.categoryTitle} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Çekim Sonrası</SectionHeading>
        <div className="mt-5 rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
          <PostShootBlock title="Dijital" section={data.postShoot.digital} />
          <PostShootBlock
            title="Düzenleme"
            section={data.postShoot.editing}
            last={!showPrinting}
          />
          {showPrinting ? (
            <PostShootBlock title="Baskı" section={data.postShoot.printing} last />
          ) : null}
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
              {data.installments.map((row, index) => (
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
                      index % 2 === 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPrice(row.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-4 text-sm text-zinc-500">
              Ödeme vadesi tanımlanmamış.
            </p>
          )}
        </div>
      </section>

      <TrackingPurchasedProducts products={data.purchasedProducts} />

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
}: {
  data: TrackingData;
  exportRef?: Ref<HTMLDivElement>;
}) {
  return (
    <TrackingPageShell>
      <TrackingOrderBody data={data} exportRef={exportRef} />
    </TrackingPageShell>
  );
}

function TrackingOrderBody({
  data,
  exportRef,
}: {
  data: TrackingData;
  exportRef?: Ref<HTMLDivElement>;
}) {
  const trackingData = normalizeTrackingData(data);

  return (
    <div ref={exportRef} className="mx-auto max-w-5xl">
      <CoupleOrderHeader data={trackingData} />
      <ReservationOrderDocument data={trackingData} showCoupleHeader={false} />
    </div>
  );
}

function CoupleOrderHeader({ data }: { data: TrackingData }) {
  return (
    <header className="border-b border-white/10 pb-8 pt-2 text-center sm:pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-500">
        {data.formYear} / bekography — Sipariş Formu
      </p>

      <div className="mt-8 flex flex-row items-end justify-center gap-3 px-2 sm:gap-8 md:gap-12">
        <CoupleName label="Gelin" name={data.brideName} iconSrc="/bride.svg" />
        <span className="font-couple mb-8 shrink-0 text-xl text-zinc-600 sm:text-2xl md:text-3xl">
          &
        </span>
        <CoupleName label="Damat" name={data.groomName} iconSrc="/groom.svg" />
      </div>
    </header>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
      {children}
    </h2>
  );
}

function CoupleName({
  label,
  name,
  iconSrc,
}: {
  label: string;
  name: string;
  iconSrc: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5 sm:gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 sm:h-12 sm:w-12">
        <img
          src={iconSrc}
          alt=""
          className="h-full w-full object-contain brightness-0 invert"
        />
      </span>
      <div className="w-full text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>
        <p className="font-couple mt-1 break-words text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
          {name}
        </p>
      </div>
    </div>
  );
}

function ShootServiceCard({ item }: { item: TrackingData["items"][number] }) {
  const shootDateLabel = format(new Date(item.shootDate), "d MMMM yyyy", {
    locale: tr,
  });
  const timeLabel = item.isOutdoor
    ? `${item.departureTime || "—"} — ${item.arrivalTime || "—"}`
    : `${item.startTime || "—"} — ${item.endTime || "—"}`;
  const timeCaption = item.isOutdoor ? "Rize Çıkış — Varış" : "Başlangıç — Bitiş";

  return (
    <article className="rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
      <h3
        className="text-xl font-semibold leading-none sm:text-2xl"
        style={{ color: item.accentColor }}
      >
        {item.categoryTitle}
      </h3>

      <div className="mt-6 grid gap-5 border-y border-white/10 py-5 sm:grid-cols-3">
        <ShootMetaLarge label="Tarih" value={shootDateLabel} />
        <ShootMetaLarge label={timeCaption} value={timeLabel} />
        <ShootMetaLarge label="Çekim Türü" value={item.shootTypeLabel} />
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-zinc-500">
        {item.shootContent ? (
          <p>
            İçerik: <span className="text-zinc-300">{item.shootContent}</span>
          </p>
        ) : null}
        {item.readyTime ? (
          <p>
            Hazır Olma: <span className="text-zinc-300">{item.readyTime}</span>
          </p>
        ) : null}
        {item.location ? (
          <p>
            Çekim Yeri: <span className="text-zinc-300">{item.location}</span>
          </p>
        ) : null}
        <p>
          B. Fiyat:{" "}
          <span className="text-zinc-300">{formatPrice(item.agreedUnitPrice)}</span>
        </p>
        <p>
          Ödeme: <span className="text-zinc-300">{item.paymentType}</span>
        </p>
      </div>

      {item.workflow ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Sipariş Durumu
          </p>
          <TrackingWorkflowTimeline workflow={item.workflow} embedded />
        </div>
      ) : null}
    </article>
  );
}

function ShootMetaLarge({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function PostShootBlock({
  title,
  section,
  last = false,
}: {
  title: string;
  section: PostShootSection;
  last?: boolean;
}) {
  if (!section.description.trim() && section.pills.length === 0) {
    return null;
  }

  return (
    <div className={last ? "" : "mb-6 border-b border-white/10 pb-6"}>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {section.pills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {section.pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-200"
            >
              {pill}
            </span>
          ))}
        </div>
      ) : null}
      {section.description ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {section.description}
        </p>
      ) : null}
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
