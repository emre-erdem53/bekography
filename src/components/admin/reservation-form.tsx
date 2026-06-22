"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertTriangle, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  emptyPostShootSnapshot,
  isOutdoorCategory,
  parsePostShootSnapshot,
  syncPostShootWithItems,
  type PostShootSection,
  type PostShootSnapshot,
} from "@/lib/post-shoot";
import type { PostShootTemplateSettingsData } from "@/lib/post-shoot-template-settings";
import { PostShootSectionEditor } from "@/components/admin/post-shoot-templates-admin-client";
import { formatCoupleName } from "@/lib/reservation-utils";

const TIME_STEP_SECONDS = 900;

function snapTimeToQuarterHour(value: string): string {
  if (!value) return value;

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;

  let hours = Number(match[1]);
  let minutes = Number(match[2]);
  let snapped = Math.round(minutes / 15) * 15;

  if (snapped === 60) {
    hours = (hours + 1) % 24;
    snapped = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

type PackageOption = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
};

type PackageCategory = {
  id: string;
  slug: string;
  title: string;
  accentColor: string;
  content: PackageCategoryContent;
  options: PackageOption[];
};

type SelectedItem = {
  packageOptionId: string;
  categoryId: string;
  paymentType: "pesin" | "taksitli";
  unitPrice: number;
  label: string;
  categoryTitle: string;
  categorySlug: string;
  accentColor: string;
  shootDate: string;
  shootContent: string;
  readyTime: string;
  location: string;
  agreedUnitPrice: number;
  departureTime: string;
  arrivalTime: string;
  startTime: string;
  endTime: string;
};

type Installment = {
  amount: number;
  dueDate: string;
};

function hasPartialPayment(items: SelectedItem[]) {
  return items.some((item) => item.paymentType === "taksitli");
}

function splitEqualInstallments(
  count: number,
  total: number,
  existing: Installment[] = [],
): Installment[] {
  const safeCount = Math.max(1, count);
  const safeTotal = Math.max(0, total);
  const base = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal - base * safeCount;

  return Array.from({ length: safeCount }, (_, index) => ({
    amount: index === safeCount - 1 ? base + remainder : base,
    dueDate: existing[index]?.dueDate ?? "",
  }));
}

type ReservationFormProps = {
  reservationId?: string;
};

const CANCELLATION_POLICY =
  "30 günden fazla süre kalan bir çekimi iptal eden taraf karşı tarafa toplam ücretin %50'sini cayma bedeli olarak öder. 30 günden daha az bir süre varsa bu oran %75'tir. Sözleşmedeki mücbir sebeplerle iptal olursa oran %25'tir.";

export function ReservationForm({ reservationId }: ReservationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const prefillDateParam = searchParams.get("date");
  const isEditing = Boolean(reservationId);
  const { labels: paymentLabels } = usePaymentTypeCopy();

  const [brideName, setBrideName] = useState("");
  const [brideTc, setBrideTc] = useState("");
  const [bridePhone, setBridePhone] = useState("");
  const [groomName, setGroomName] = useState("");
  const [groomTc, setGroomTc] = useState("");
  const [groomPhone, setGroomPhone] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [cancellationFeeMax, setCancellationFeeMax] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([
    { amount: 0, dueDate: "" },
  ]);
  const [postShoot, setPostShoot] = useState<PostShootSnapshot>(
    emptyPostShootSnapshot(),
  );
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [dateConflicts, setDateConflicts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPriceManual, setTotalPriceManual] = useState(false);
  const [templateSettings, setTemplateSettings] =
    useState<PostShootTemplateSettingsData | null>(null);
  const [defaultShootDate, setDefaultShootDate] = useState("");

  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.agreedUnitPrice, 0),
    [items],
  );

  const installmentTotal = useMemo(
    () => installments.reduce((sum, row) => sum + row.amount, 0),
    [installments],
  );

  const expectedPayable = totalPrice - discountAmount;

  const hasTaksitliPayment = useMemo(
    () => hasPartialPayment(items),
    [items],
  );

  const installmentMismatch = installmentTotal !== expectedPayable;

  const minInstallmentCount = hasTaksitliPayment ? 2 : 1;

  function addInstallment() {
    setInstallments((prev) =>
      splitEqualInstallments(prev.length + 1, expectedPayable, prev),
    );
  }

  function removeInstallment(index: number) {
    setInstallments((prev) => {
      if (prev.length <= minInstallmentCount) return prev;
      const next = prev.filter((_, i) => i !== index);
      return splitEqualInstallments(next.length, expectedPayable, next);
    });
  }

  function updateInstallment(index: number, patch: Partial<Installment>) {
    setInstallments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function applyPostShootSync(nextItems: SelectedItem[], forceReset = false) {
    if (!templateSettings) return;
    setPostShoot((prev) =>
      syncPostShootWithItems(
        prev,
        nextItems,
        categories,
        templateSettings,
        { forceReset },
      ),
    );
  }

  useEffect(() => {
    async function load() {
      const [packagesRes, templatesRes] = await Promise.all([
        fetch("/api/admin/packages"),
        fetch("/api/admin/post-shoot-templates"),
      ]);
      const packages: PackageCategory[] = await packagesRes.json();
      const templates: PostShootTemplateSettingsData = await templatesRes.json();
      setCategories(packages);
      setTemplateSettings(templates);

      if (reservationId) {
        const reservationRes = await fetch(
          `/api/admin/reservations/${reservationId}`,
        );
        const reservation = await reservationRes.json();
        setBrideName(reservation.brideName);
        setBrideTc(reservation.brideTc ?? "");
        setBridePhone(reservation.bridePhone);
        setGroomName(reservation.groomName);
        setGroomTc(reservation.groomTc ?? "");
        setGroomPhone(reservation.groomPhone);
        setTotalPrice(reservation.totalPrice);
        setTotalPriceManual(true);
        setCancellationFeeMax(reservation.cancellationFeeMax);
        setDiscountAmount(reservation.discountAmount);
        setNotes(reservation.notes ?? "");
        setPostShoot(parsePostShootSnapshot(reservation.postShoot));
        setItems(
          reservation.items.map(
            (item: {
              packageOption: {
                id: string;
                label: string;
                category: {
                  id: string;
                  title: string;
                  slug: string;
                  accentColor: string;
                };
              };
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
            }) => ({
              packageOptionId: item.packageOption.id,
              categoryId: item.packageOption.category.id,
              paymentType: item.paymentType,
              unitPrice: item.unitPrice,
              label: item.packageOption.label,
              categoryTitle: item.packageOption.category.title,
              categorySlug: item.packageOption.category.slug,
              accentColor: item.packageOption.category.accentColor,
              shootDate: item.shootDate.split("T")[0],
              shootContent: item.shootContent,
              readyTime: item.readyTime,
              location: item.location,
              agreedUnitPrice: item.agreedUnitPrice,
              departureTime: item.departureTime ?? "",
              arrivalTime: item.arrivalTime ?? "",
              startTime: item.startTime ?? "",
              endTime: item.endTime ?? "",
            }),
          ),
        );
        setInstallments(
          reservation.installments?.length > 0
            ? reservation.installments.map(
                (row: { amount: number; dueDate: string }) => ({
                  amount: row.amount,
                  dueDate: row.dueDate.split("T")[0],
                }),
              )
            : [{ amount: 0, dueDate: "" }],
        );
      } else if (requestId) {
        const requestRes = await fetch(`/api/admin/requests/${requestId}`);
        const request = await requestRes.json();
        setGroomName(request.customerName);
        if (request.customerPhone && request.customerPhone !== "—") {
          setGroomPhone(request.customerPhone);
        }
        const defaultDate = request.shootDate.split("T")[0];
        const mapped: SelectedItem[] = request.items.map(
          (item: {
            packageOption: {
              id: string;
              label: string;
              category: {
                id: string;
                title: string;
                slug: string;
                accentColor: string;
                content: PackageCategoryContent;
              };
            };
            paymentType: "pesin" | "taksitli";
            unitPrice: number;
          }) => {
            const outdoor = isOutdoorCategory(
              item.packageOption.category.slug,
              item.packageOption.category.content ?? {},
            );
            return {
              packageOptionId: item.packageOption.id,
              categoryId: item.packageOption.category.id,
              paymentType: item.paymentType,
              unitPrice: item.unitPrice,
              label: item.packageOption.label,
              categoryTitle: item.packageOption.category.title,
              categorySlug: item.packageOption.category.slug,
              accentColor: item.packageOption.category.accentColor,
              shootDate: defaultDate,
              shootContent:
                item.packageOption.category.content?.shootDescription?.trim() ||
                item.packageOption.label,
              readyTime: "",
              location: request.city ?? "",
              agreedUnitPrice: item.unitPrice,
              departureTime: outdoor ? "" : "",
              arrivalTime: outdoor ? "" : "",
              startTime: outdoor ? "" : "",
              endTime: outdoor ? "" : "",
            };
          },
        );
        setItems(mapped);
        const total = mapped.reduce((sum, i) => sum + i.agreedUnitPrice, 0);
        setTotalPrice(total);
        setInstallments(splitEqualInstallments(2, total));
      } else if (
        prefillDateParam &&
        /^\d{4}-\d{2}-\d{2}$/.test(prefillDateParam)
      ) {
        setDefaultShootDate(prefillDateParam);
      }

      setLoading(false);
    }

    load();
  }, [requestId, reservationId, prefillDateParam]);

  useEffect(() => {
    if (!templateSettings || categories.length === 0 || items.length === 0) {
      return;
    }
    if (reservationId) return;
    if (!requestId) return;
    setPostShoot(
      syncPostShootWithItems(
        emptyPostShootSnapshot(),
        items,
        categories,
        templateSettings,
      ),
    );
  }, [templateSettings, categories, requestId, reservationId, items]);

  useEffect(() => {
    if (!totalPriceManual && items.length > 0) {
      setTotalPrice(itemsTotal);
    }
  }, [itemsTotal, items.length, totalPriceManual]);

  useEffect(() => {
    if (loading) return;

    setInstallments((prev) => {
      if (hasPartialPayment(items)) {
        if (prev.length < 2) {
          return splitEqualInstallments(2, expectedPayable, prev);
        }
        return prev;
      }

      if (prev.length > 1) {
        return [{ amount: expectedPayable, dueDate: prev[0]?.dueDate ?? "" }];
      }

      if (
        prev.length === 1 &&
        prev[0].amount !== expectedPayable &&
        expectedPayable >= 0
      ) {
        return [{ ...prev[0], amount: expectedPayable }];
      }

      return prev;
    });
  }, [loading, items, expectedPayable]);

  useEffect(() => {
    const dates = [...new Set(items.map((item) => item.shootDate).filter(Boolean))];
    if (dates.length === 0) {
      setDateConflicts([]);
      return;
    }

    Promise.all(
      dates.map((shootDate) =>
        fetch("/api/admin/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shootDate,
            excludeReservationId: reservationId,
          }),
        }).then((res) => res.json()),
      ),
    ).then((results) => {
      const conflicts = dates.filter((_, index) => !results[index]?.available);
      setDateConflicts(conflicts);
    });
  }, [items, reservationId]);

  function findCategoryForOption(optionId: string) {
    return categories.find((category) =>
      category.options.some((option) => option.id === optionId),
    );
  }

  function addItem(optionId: string) {
    const category = findCategoryForOption(optionId);
    const option = category?.options.find((o) => o.id === optionId);
    if (!category || !option) return;

    const packageContent = category.content as PackageCategoryContent | undefined;

    const newItem: SelectedItem = {
      packageOptionId: option.id,
      categoryId: category.id,
      paymentType: "pesin",
      unitPrice: option.cashPrice,
      label: option.label,
      categoryTitle: category.title,
      categorySlug: category.slug,
      accentColor: category.accentColor,
      shootDate: defaultShootDate,
      shootContent:
        packageContent?.shootDescription?.trim() || option.label,
      readyTime: "",
      location: "",
      agreedUnitPrice: option.cashPrice,
      departureTime: "",
      arrivalTime: "",
      startTime: "",
      endTime: "",
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    applyPostShootSync(nextItems);
  }

  function removeItem(index: number) {
    const nextItems = items.filter((_, i) => i !== index);
    setItems(nextItems);
    applyPostShootSync(nextItems);
  }

  function updateItem(index: number, patch: Partial<SelectedItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function updatePostShootSection(
    key: "digital" | "editing" | "printing",
    section: PostShootSection,
  ) {
    setPostShoot((prev) => ({
      ...prev,
      [key]: section,
      source: "manual",
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (dateConflicts.length > 0) return;

    if (installmentTotal !== expectedPayable) {
      const confirmed = window.confirm(
        `Ödeme vadeleri toplamı (${formatPrice(installmentTotal)}) beklenen tutarla (${formatPrice(expectedPayable)}) eşleşmiyor. Yine de kaydetmek istiyor musunuz?`,
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError("");

    const payload = {
      brideName,
      brideTc: brideTc || undefined,
      bridePhone,
      groomName,
      groomTc: groomTc || undefined,
      groomPhone,
      totalPrice,
      cancellationFeeMax,
      discountAmount,
      postShoot,
      notes: notes || undefined,
      items: items.map((item) => {
        const outdoor = isOutdoorCategory(
          item.categorySlug,
          findCategoryForOption(item.packageOptionId)?.content ?? {},
        );
        return {
          packageOptionId: item.packageOptionId,
          paymentType: item.paymentType,
          unitPrice: item.unitPrice,
          shootDate: item.shootDate,
          shootContent: item.shootContent,
          readyTime: item.readyTime,
          location: item.location,
          agreedUnitPrice: item.agreedUnitPrice,
          departureTime: outdoor ? item.departureTime || null : null,
          arrivalTime: outdoor ? item.arrivalTime || null : null,
          startTime: outdoor ? null : item.startTime || null,
          endTime: outdoor ? null : item.endTime || null,
        };
      }),
      installments,
      ...(requestId && !isEditing ? { requestId } : {}),
    };

    const response = await fetch(
      isEditing
        ? `/api/admin/reservations/${reservationId}`
        : "/api/admin/reservations",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (!response.ok) {
      const data = await response.json();
      setError(
        data.error ??
          (isEditing
            ? "Rezervasyon güncellenemedi"
            : "Rezervasyon oluşturulamadı"),
      );
      if (data.conflicts) setDateConflicts(data.conflicts);
      return;
    }

    const data = await response.json();
    router.push(
      isEditing
        ? `/admin/rezervasyonlar/${reservationId}`
        : `/admin/rezervasyonlar/${data.id}/ozet`,
    );
    router.refresh();
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;

  const backHref = isEditing
    ? `/admin/rezervasyonlar/${reservationId}`
    : "/admin/rezervasyonlar";

  const coupleTitle = formatCoupleName(brideName, groomName);

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-zinc-400 hover:text-white">
          ← {isEditing ? "Rezervasyon detayı" : "Rezervasyonlar"}
        </Link>
        <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
          Sipariş Formu
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
          {isEditing ? `${coupleTitle} — Düzenle` : "Yeni Rezervasyon"}
        </h1>
        {defaultShootDate && !isEditing ? (
          <p className="mt-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
            Seçilen çekim tarihi:{" "}
            <span className="font-semibold text-white">
              {format(new Date(`${defaultShootDate}T12:00:00`), "d MMMM yyyy", {
                locale: tr,
              })}
            </span>
          </p>
        ) : null}
      </div>

      {dateConflicts.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>Bu tarihler için zaten rezervasyon bulunmaktadır:</p>
            <ul className="mt-1 list-disc pl-4">
              {dateConflicts.map((date) => (
                <li key={date}>{date}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <Section title="1. Müşteri Bilgileri">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Damat Ad Soyad">
            <input
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Damat TC">
            <input
              value={groomTc}
              onChange={(e) => setGroomTc(e.target.value.replace(/\D/g, "").slice(0, 11))}
              pattern="\d{11}"
              placeholder="11 haneli"
              className={inputClass}
            />
          </Field>
          <Field label="Damat Tel">
            <input
              value={groomPhone}
              onChange={(e) => setGroomPhone(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <div />
          <Field label="Gelin Ad Soyad">
            <input
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Gelin TC">
            <input
              value={brideTc}
              onChange={(e) => setBrideTc(e.target.value.replace(/\D/g, "").slice(0, 11))}
              pattern="\d{11}"
              placeholder="11 haneli"
              className={inputClass}
            />
          </Field>
          <Field label="Gelin Tel">
            <input
              value={bridePhone}
              onChange={(e) => setBridePhone(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Notlar">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="2. Çekim Hizmeti">
        <div className="mb-4">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addItem(e.target.value);
                e.target.value = "";
              }
            }}
            className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white sm:max-w-xs sm:ml-auto sm:block"
            defaultValue=""
          >
            <option value="">Paket ekle...</option>
            {categories.flatMap((category) =>
              category.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {category.title} — {option.label}
                </option>
              )),
            )}
          </select>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const category = findCategoryForOption(item.packageOptionId);
            const outdoor = isOutdoorCategory(
              item.categorySlug,
              category?.content ?? {},
            );

            return (
              <div
                key={`${item.packageOptionId}-${index}`}
                className="rounded-xl border border-white/10 p-4"
                style={{ borderColor: `${item.accentColor}55` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: item.accentColor }}
                  >
                    {item.categoryTitle}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-sm text-red-400"
                  >
                    Kaldır
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Çekim Günü">
                    <input
                      type="date"
                      value={item.shootDate}
                      onChange={(e) =>
                        updateItem(index, { shootDate: e.target.value })
                      }
                      required
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Çekim İçeriği">
                    <input
                      value={item.shootContent}
                      onChange={(e) =>
                        updateItem(index, { shootContent: e.target.value })
                      }
                      required
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Hazır Olma Saati">
                    <input
                      type="time"
                      step={TIME_STEP_SECONDS}
                      value={item.readyTime}
                      onChange={(e) =>
                        updateItem(index, {
                          readyTime: snapTimeToQuarterHour(e.target.value),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Belirlenen Fiyat (₺)">
                    <input
                      type="number"
                      value={item.agreedUnitPrice}
                      onChange={(e) => {
                        const agreedUnitPrice = Number(e.target.value);
                        updateItem(index, {
                          agreedUnitPrice,
                          unitPrice: agreedUnitPrice,
                        });
                      }}
                      required
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Çekim Lokasyonu">
                    <input
                      value={item.location}
                      onChange={(e) =>
                        updateItem(index, { location: e.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Ödeme Tipi">
                    <select
                      value={item.paymentType}
                      onChange={(e) => {
                        const paymentType = e.target.value as "pesin" | "taksitli";
                        const option = category?.options.find(
                          (o) => o.id === item.packageOptionId,
                        );
                        const unitPrice =
                          paymentType === "pesin"
                            ? option!.cashPrice
                            : option!.installmentPrice;
                        updateItem(index, {
                          paymentType,
                          unitPrice,
                          agreedUnitPrice: unitPrice,
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="pesin">{paymentLabels.pesin}</option>
                      <option value="taksitli">{paymentLabels.taksitli}</option>
                    </select>
                  </Field>

                  {outdoor ? (
                    <>
                      <Field label="Rize'den Çıkış">
                        <input
                          type="time"
                          step={TIME_STEP_SECONDS}
                          value={item.departureTime}
                          onChange={(e) =>
                            updateItem(index, {
                              departureTime: snapTimeToQuarterHour(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Rize'ye Varış">
                        <input
                          type="time"
                          step={TIME_STEP_SECONDS}
                          value={item.arrivalTime}
                          onChange={(e) =>
                            updateItem(index, {
                              arrivalTime: snapTimeToQuarterHour(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Başlangıç">
                        <input
                          type="time"
                          step={TIME_STEP_SECONDS}
                          value={item.startTime}
                          onChange={(e) =>
                            updateItem(index, {
                              startTime: snapTimeToQuarterHour(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Bitiş">
                        <input
                          type="time"
                          step={TIME_STEP_SECONDS}
                          value={item.endTime}
                          onChange={(e) =>
                            updateItem(index, {
                              endTime: snapTimeToQuarterHour(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz paket eklenmedi.</p>
        ) : (
          <p className="mt-4 text-right text-sm text-zinc-400">
            Paket toplamı: {formatPrice(itemsTotal)}
          </p>
        )}
      </Section>

      <Section title="3. Çekim Sonrası">
        <p className="text-sm text-zinc-400">
          Global şablondan otomatik oluşturulur; seçilen tüm paketler tek metinde
          birleştirilir. Düzenlerseniz manuel kayda geçer.
          {postShoot.source === "manual" ? (
            <span className="mt-1 block text-amber-300/90">
              Bu rezervasyon için metinler manuel düzenlendi.
            </span>
          ) : null}
        </p>
        <PostShootSectionEditor
          title="Dijital"
          section={postShoot.digital}
          onChange={(section) => updatePostShootSection("digital", section)}
        />
        <PostShootSectionEditor
          title="Düzenleme"
          section={postShoot.editing}
          onChange={(section) => updatePostShootSection("editing", section)}
        />
        <PostShootSectionEditor
          title="Baskı"
          section={postShoot.printing}
          onChange={(section) => updatePostShootSection("printing", section)}
        />
        <button
          type="button"
          onClick={() => applyPostShootSync(items, true)}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Global şablondan yeniden doldur
        </button>
      </Section>

      <Section title="4. Ödeme Planı">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Toplam Fiyat (₺)">
            <input
              type="number"
              value={totalPrice}
              onChange={(e) => {
                setTotalPriceManual(true);
                setTotalPrice(Number(e.target.value));
              }}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Cayma Bedeli Maksimum (₺)">
            <input
              type="number"
              value={cancellationFeeMax}
              onChange={(e) => setCancellationFeeMax(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="İndirim (₺)">
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-medium text-white">Ödeme Vadeleri</h3>
            <button
              type="button"
              onClick={addInstallment}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Vade Ekle
            </button>
          </div>
          {installments.map((row, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto]">
              <Field label={`Ödenecek Tutar ${index + 1} (₺)`}>
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e) =>
                    updateInstallment(index, { amount: Number(e.target.value) })
                  }
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Vade Tarihi">
                <input
                  type="date"
                  value={row.dueDate}
                  onChange={(e) =>
                    updateInstallment(index, { dueDate: e.target.value })
                  }
                  required
                  className={inputClass}
                />
              </Field>
              {installments.length > minInstallmentCount ? (
                <button
                  type="button"
                  onClick={() => removeInstallment(index)}
                  className="self-end rounded-lg p-2 text-zinc-400 hover:text-red-400 sm:mt-6"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
          <p
            className={`text-sm ${
              installmentMismatch ? "text-amber-400" : "text-zinc-400"
            }`}
          >
            Beklenen ödeme: {formatPrice(expectedPayable)} — Vade toplamı:{" "}
            {formatPrice(installmentTotal)}
          </p>
          {installmentMismatch ? (
            <p className="text-sm text-amber-400">
              Vade tutarları toplamı genel tutarla eşleşmiyor. Kaydetmeden önce
              vadeleri güncelleyin veya kayıt sırasında onaylayın.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <p>{CANCELLATION_POLICY}</p>
        </div>
      </Section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || dateConflicts.length > 0 || items.length === 0}
        className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50 sm:w-auto"
      >
        {saving
          ? isEditing
            ? "Kaydediliyor..."
            : "Oluşturuluyor..."
          : isEditing
            ? "Değişiklikleri Kaydet"
            : "Rezervasyon Oluştur"}
      </button>
    </form>
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-white outline-none focus:border-white/30";
