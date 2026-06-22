"use client";

import { forwardRef, type Ref } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertTriangle, BadgeCheck, Check, UserRound } from "lucide-react";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_ORDER,
  formatPrice,
} from "@/lib/constants";
import type { PostShootSection } from "@/lib/post-shoot";
import type { TrackingData } from "@/lib/tracking-types";

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
  { data: TrackingData }
>(function ReservationOrderDocument({ data }, ref) {
  return (
    <div ref={ref} className="mx-auto max-w-5xl">
      <header className="border-b border-white/10 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-500">
          {data.formYear} / bekography — Sipariş Formu
        </p>
        <h1 className="font-brand mt-4 text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
          {data.coupleName}
        </h1>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <ContactCard
            label="Gelin"
            name={data.brideName}
            phone={data.bridePhone}
            tc={data.brideTc}
          />
          <ContactCard
            label="Damat"
            name={data.groomName}
            phone={data.groomPhone}
            tc={data.groomTc}
          />
        </div>
      </header>

      <section className="mt-10">
        <SectionHeading>Çekim Hizmeti</SectionHeading>
        <div className="mt-5 space-y-4">
          {data.items.map((item, index) => (
            <ShootServiceCard key={index} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Çekim Sonrası</SectionHeading>
        <div className="mt-5 rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
          <PostShootBlock title="Dijital" section={data.postShoot.digital} />
          <PostShootBlock title="Düzenleme" section={data.postShoot.editing} />
          <PostShootBlock title="Baskı" section={data.postShoot.printing} last />
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Ödeme Planı</SectionHeading>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/15 bg-[#0a0a0a]">
          <div className="grid min-w-[720px] grid-cols-3 border-b border-white/10">
            <PaymentSummaryCell
              label="Toplam Fiyat"
              value={formatPrice(data.totalPrice)}
            />
            <PaymentSummaryCell
              label="Cayma Bedeli"
              value={formatPrice(data.cancellationFeeMax)}
            />
            <PaymentSummaryCell
              label="İndirim"
              value={formatPrice(data.discountAmount)}
            />
          </div>
          {data.installments.length > 0 ? (
            <div
              className="grid min-w-[720px]"
              style={{
                gridTemplateColumns: `repeat(${data.installments.length}, minmax(0, 1fr))`,
              }}
            >
              {data.installments.map((row, index) => (
                <div
                  key={index}
                  className="border-r border-white/10 px-5 py-4 last:border-r-0"
                >
                  <p className="text-xs text-zinc-500">
                    Ödenecek{" "}
                    {format(new Date(row.dueDate), "d MMMM yyyy", {
                      locale: tr,
                    })}
                  </p>
                  <p
                    className={`mt-2 text-2xl font-semibold ${
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
      <ReservationOrderDocument data={data} />
      <TrackingProcessSection data={data} />
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
      <ReservationOrderDocument ref={exportRef} data={data} />
    </TrackingPageShell>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
      {children}
    </h2>
  );
}

function ContactCard({
  label,
  name,
  phone,
  tc,
}: {
  label: string;
  name: string;
  phone: string;
  tc: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300">
        <UserRound className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="truncate text-sm text-zinc-400">{phone || "—"}</p>
      </div>
      {tc ? (
        <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
          <span className="hidden sm:inline">{tc}</span>
          <BadgeCheck className="h-4 w-4 text-emerald-400" />
        </div>
      ) : null}
    </div>
  );
}

function ShootServiceCard({ item }: { item: TrackingData["items"][number] }) {
  const shootDateLabel = format(new Date(item.shootDate), "d MMMM", {
    locale: tr,
  });

  return (
    <article className="rounded-2xl border border-white/15 bg-[#0a0a0a] p-5 sm:p-6">
      <h3
        className="font-brand text-3xl leading-none sm:text-4xl"
        style={{ color: item.accentColor }}
      >
        {item.categoryTitle}
      </h3>

      <div className="mt-5 grid gap-4 border-y border-white/10 py-4 sm:grid-cols-4">
        <ShootMeta label="Tarih" value={shootDateLabel} />
        <ShootMeta label="İçerik" value={item.shootContent} />
        {item.isOutdoor ? (
          <>
            <ShootMeta
              label="Rize'den Çıkış"
              value={item.departureTime || "—"}
            />
            <ShootMeta label="Rize'ye Varış" value={item.arrivalTime || "—"} />
          </>
        ) : (
          <>
            <ShootMeta label="Başlangıç" value={item.startTime || "—"} />
            <ShootMeta label="Bitiş" value={item.endTime || "—"} />
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
        {item.readyTime ? (
          <p>
            Hazır Olma: <span className="text-white">{item.readyTime}</span>
          </p>
        ) : null}
        {item.location ? (
          <p>
            Çekim Yeri: <span className="text-white">{item.location}</span>
          </p>
        ) : null}
        <p>
          B. Fiyat:{" "}
          <span className="font-semibold text-white">
            {formatPrice(item.agreedUnitPrice)}
          </span>
        </p>
        <p>
          Ödeme: <span className="text-white">{item.paymentType}</span>
        </p>
      </div>
    </article>
  );
}

function ShootMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
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
    <div className="border-r border-white/10 px-5 py-4 last:border-r-0">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
