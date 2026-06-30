"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertTriangle, Plus, X } from "lucide-react";
import { nanoid } from "nanoid";
import { formatPrice, OUTDOOR_DEFAULT_ARRIVAL_TIME, OUTDOOR_DEFAULT_DEPARTURE_TIME } from "@/lib/constants";
import { toDateInputValue } from "@/lib/date-only";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  emptyPostShootSnapshot,
  isOutdoorCategory,
  parsePostShootSnapshot,
  syncPostShootWithItems,
  type PostShootSnapshot,
} from "@/lib/post-shoot";
import { ReservationPackageStageTagsEditor } from "@/components/admin/reservation-package-stage-tags-editor";
import { PhoneInput } from "@/components/forms/phone-input";
import { PersonNameInput } from "@/components/forms/person-name-input";
import {
  emptyItemWorkflowStageTags,
  type ItemWorkflowStageTags,
} from "@/lib/item-workflow-stage-tags";
import {
  calculateCancellationFeeMax,
  CANCELLATION_POLICY,
  describeCancellationFeeRate,
  getEarliestShootDateInput,
  resolveCancellationFeeRate,
} from "@/lib/cancellation-fee";
import { isValidTurkishMobilePhone, normalizeTurkishMobileForStorage } from "@/lib/phone-utils";
import { enforcePersonNamePartInput } from "@/lib/person-name-input";
import {
  formatCoupleName,
  joinPersonName,
  parseRequestCustomerName,
  splitPersonName,
} from "@/lib/reservation-utils";

const TIME_STEP_SECONDS = 900;
const DEFAULT_READY_TIME = "12:30";

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
  itemKey: string;
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

function redistributeInstallmentAmounts(
  installments: Installment[],
  changedIndex: number,
  amount: number,
  expectedTotal: number,
): Installment[] {
  const next = [...installments];
  next[changedIndex] = { ...next[changedIndex], amount };

  if (next.length === 2) {
    const otherIndex = changedIndex === 0 ? 1 : 0;
    next[otherIndex] = {
      ...next[otherIndex],
      amount: Math.max(0, expectedTotal - amount),
    };
    return next;
  }

  const assignedTotal = next.reduce((sum, row, index) => {
    if (index === changedIndex) return sum + amount;
    return sum + row.amount;
  }, 0);
  const remaining = Math.max(0, expectedTotal - assignedTotal);
  const adjustableIndexes = next
    .map((_, index) => index)
    .filter((index) => index !== changedIndex);

  if (adjustableIndexes.length === 1) {
    const otherIndex = adjustableIndexes[0];
    next[otherIndex] = { ...next[otherIndex], amount: remaining };
  }

  return next;
}

type ReservationFormProps = {
  reservationId?: string;
};

export function ReservationForm({ reservationId }: ReservationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const prefillDateParam = searchParams.get("date");
  const isEditing = Boolean(reservationId);
  const { labels: paymentLabels } = usePaymentTypeCopy();

  const [brideFirstName, setBrideFirstName] = useState("");
  const [brideLastName, setBrideLastName] = useState("");
  const [brideTc, setBrideTc] = useState("");
  const [bridePhone, setBridePhone] = useState("");
  const [groomFirstName, setGroomFirstName] = useState("");
  const [groomLastName, setGroomLastName] = useState("");
  const [groomTc, setGroomTc] = useState("");
  const [groomPhone, setGroomPhone] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(false);
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
  const [defaultShootDate, setDefaultShootDate] = useState("");
  const trackedItemsTotalRef = useRef<number | null>(null);

  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.agreedUnitPrice, 0),
    [items],
  );

  const installmentTotal = useMemo(
    () => installments.reduce((sum, row) => sum + row.amount, 0),
    [installments],
  );

  const effectiveDiscount = discountEnabled ? discountAmount : 0;
  const expectedPayable = totalPrice - effectiveDiscount;

  const earliestShootDate = useMemo(
    () => getEarliestShootDateInput(items.map((item) => item.shootDate)),
    [items],
  );

  const cancellationFeeRate = useMemo(
    () => resolveCancellationFeeRate(earliestShootDate),
    [earliestShootDate],
  );

  const cancellationFeeMax = useMemo(
    () => calculateCancellationFeeMax(totalPrice, earliestShootDate),
    [totalPrice, earliestShootDate],
  );

  const hasTaksitliPayment = useMemo(
    () => hasPartialPayment(items),
    [items],
  );

  const installmentMismatch = installmentTotal !== expectedPayable;

  const minInstallmentCount = hasTaksitliPayment ? 2 : 1;

  const itemKeysSignature = items.map((item) => item.itemKey).join(",");

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

      if (typeof patch.amount === "number") {
        return redistributeInstallmentAmounts(
          next,
          index,
          patch.amount,
          expectedPayable,
        );
      }

      return next;
    });
  }

  function applyPostShootSync(nextItems: SelectedItem[], forceReset = false) {
    if (categories.length === 0) return;
    if (
      forceReset &&
      postShoot.source === "manual" &&
      !window.confirm(
        "Bu rezervasyon için özelleştirilmiş etiketler paket incele etiketleriyle yeniden doldurulacak. Devam edilsin mi?",
      )
    ) {
      return;
    }
    setPostShoot((prev) =>
      syncPostShootWithItems(
        prev,
        nextItems.map((item) => ({
          packageOptionId: item.packageOptionId,
          categoryTitle: item.categoryTitle,
          itemKey: item.itemKey,
        })),
        categories,
        { forceReset },
      ),
    );
  }

  useEffect(() => {
    async function load() {
      const packagesRes = await fetch("/api/admin/packages");
      const packages: PackageCategory[] = await packagesRes.json();
      setCategories(packages);

      if (reservationId) {
        const reservationRes = await fetch(
          `/api/admin/reservations/${reservationId}`,
        );
        const reservation = await reservationRes.json();
        const brideParts = splitPersonName(reservation.brideName);
        const groomParts = splitPersonName(reservation.groomName);
        setBrideFirstName(
          enforcePersonNamePartInput(
            reservation.brideFirstName || brideParts.firstName,
          ),
        );
        setBrideLastName(
          enforcePersonNamePartInput(
            reservation.brideLastName || brideParts.lastName,
          ),
        );
        setBrideTc(reservation.brideTc ?? "");
        setBridePhone(normalizeTurkishMobileForStorage(reservation.bridePhone));
        setGroomFirstName(
          enforcePersonNamePartInput(
            reservation.groomFirstName || groomParts.firstName,
          ),
        );
        setGroomLastName(
          enforcePersonNamePartInput(
            reservation.groomLastName || groomParts.lastName,
          ),
        );
        setGroomTc(reservation.groomTc ?? "");
        setGroomPhone(normalizeTurkishMobileForStorage(reservation.groomPhone));
        setTotalPrice(reservation.totalPrice);
        setTotalPriceManual(true);
        setDiscountAmount(reservation.discountAmount);
        setDiscountEnabled(
          reservation.discountEnabled ?? reservation.discountAmount > 0,
        );
        setNotes(reservation.notes ?? "");
        setPostShoot(parsePostShootSnapshot(reservation.postShoot));
        setItems(
          reservation.items.map(
            (item: {
              id: string;
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
            }) => {
              const outdoor = isOutdoorCategory(
                item.packageOption.category.slug,
                {},
              );
              return {
              itemKey: item.id,
              packageOptionId: item.packageOption.id,
              categoryId: item.packageOption.category.id,
              paymentType: item.paymentType,
              unitPrice: item.unitPrice,
              label: item.packageOption.label,
              categoryTitle: item.packageOption.category.title,
              categorySlug: item.packageOption.category.slug,
              accentColor: item.packageOption.category.accentColor,
              shootDate: toDateInputValue(item.shootDate),
              shootContent: item.shootContent,
              readyTime: item.readyTime?.trim() || DEFAULT_READY_TIME,
              location: item.location,
              agreedUnitPrice: item.agreedUnitPrice,
              departureTime:
                item.departureTime ??
                (outdoor ? OUTDOOR_DEFAULT_DEPARTURE_TIME : ""),
              arrivalTime:
                item.arrivalTime ??
                (outdoor ? OUTDOOR_DEFAULT_ARRIVAL_TIME : ""),
              startTime: item.startTime ?? "",
              endTime: item.endTime ?? "",
            };
            },
          ),
        );
        setInstallments(
          reservation.installments?.length > 0
            ? reservation.installments.map(
                (row: { amount: number; dueDate: string }) => ({
                  amount: row.amount,
                  dueDate: toDateInputValue(row.dueDate),
                }),
              )
            : [{ amount: 0, dueDate: "" }],
        );
      } else if (requestId) {
        const requestRes = await fetch(`/api/admin/requests/${requestId}`);
        const request = await requestRes.json();
        const parsedContact = parseRequestCustomerName(request.customerName);
        const contactRole = request.contactRole ?? parsedContact.role;
        const contactFirstName =
          request.contactFirstName?.trim() || parsedContact.firstName;
        const contactLastName =
          request.contactLastName?.trim() || parsedContact.lastName;

        if (contactRole === "gelin") {
          setBrideFirstName(enforcePersonNamePartInput(contactFirstName));
          setBrideLastName(enforcePersonNamePartInput(contactLastName));
          if (request.customerPhone && request.customerPhone !== "—") {
            setBridePhone(normalizeTurkishMobileForStorage(request.customerPhone));
          }
        } else if (contactRole === "damat") {
          setGroomFirstName(enforcePersonNamePartInput(contactFirstName));
          setGroomLastName(enforcePersonNamePartInput(contactLastName));
          if (request.customerPhone && request.customerPhone !== "—") {
            setGroomPhone(normalizeTurkishMobileForStorage(request.customerPhone));
          }
        }
        const defaultDate = toDateInputValue(request.shootDate);
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
              itemKey: nanoid(10),
              packageOptionId: item.packageOption.id,
              categoryId: item.packageOption.category.id,
              paymentType: item.paymentType,
              unitPrice: item.unitPrice,
              label: item.packageOption.label,
              categoryTitle: item.packageOption.category.title,
              categorySlug: item.packageOption.category.slug,
              accentColor: item.packageOption.category.accentColor,
              shootDate: defaultDate,
              shootContent: item.packageOption.label,
              readyTime: DEFAULT_READY_TIME,
              location: request.city ?? "",
              agreedUnitPrice: item.unitPrice,
              departureTime: outdoor ? OUTDOOR_DEFAULT_DEPARTURE_TIME : "",
              arrivalTime: outdoor ? OUTDOOR_DEFAULT_ARRIVAL_TIME : "",
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
    if (categories.length === 0 || items.length === 0) {
      return;
    }
    if (reservationId) return;
    if (!requestId) return;
    setPostShoot(
      syncPostShootWithItems(
        emptyPostShootSnapshot(),
        items,
        categories,
      ),
    );
  }, [categories, requestId, reservationId, items]);

  useEffect(() => {
    if (loading || categories.length === 0 || items.length === 0) return;

    setPostShoot((prev) => {
      const allKeysPresent = items.every((item) => prev.itemStageTags?.[item.itemKey]);
      if (allKeysPresent) return prev;

      return syncPostShootWithItems(
        prev,
        items.map((item) => ({
          packageOptionId: item.packageOptionId,
          categoryTitle: item.categoryTitle,
          itemKey: item.itemKey,
        })),
        categories,
      );
    });
  }, [loading, categories, itemKeysSignature, items]);

  useEffect(() => {
    if (loading || items.length === 0) return;

    const previousTotal = trackedItemsTotalRef.current;
    trackedItemsTotalRef.current = itemsTotal;

    if (previousTotal === null) return;

    if (itemsTotal !== previousTotal) {
      setTotalPrice(itemsTotal);
    }
  }, [loading, itemsTotal, items.length]);

  useEffect(() => {
    if (loading) return;

    setInstallments((prev) => {
      if (hasPartialPayment(items)) {
        const count = Math.max(prev.length, 2);
        const prevTotal = prev.reduce((sum, row) => sum + row.amount, 0);
        if (prev.length < 2 || prevTotal !== expectedPayable) {
          return splitEqualInstallments(count, expectedPayable, prev);
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

    const outdoor = isOutdoorCategory(
      category.slug,
      packageContent ?? {},
    );

    const newItem: SelectedItem = {
      itemKey: nanoid(10),
      packageOptionId: option.id,
      categoryId: category.id,
      paymentType: "pesin",
      unitPrice: option.cashPrice,
      label: option.label,
      categoryTitle: category.title,
      categorySlug: category.slug,
      accentColor: category.accentColor,
      shootDate: defaultShootDate,
      shootContent: option.label,
      readyTime: DEFAULT_READY_TIME,
      location: "",
      agreedUnitPrice: option.cashPrice,
      departureTime: outdoor ? OUTDOOR_DEFAULT_DEPARTURE_TIME : "",
      arrivalTime: outdoor ? OUTDOOR_DEFAULT_ARRIVAL_TIME : "",
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

  function updateItemStageTags(itemKey: string, stageTags: ItemWorkflowStageTags) {
    setPostShoot((prev) => ({
      ...prev,
      itemStageTags: {
        ...(prev.itemStageTags ?? {}),
        [itemKey]: stageTags,
      },
      source: "manual",
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (dateConflicts.length > 0) return;

    if (!isValidTurkishMobilePhone(groomPhone)) {
      setError("Damat telefonu 10 haneli olmalı ve 5 ile başlamalıdır.");
      return;
    }

    if (!isValidTurkishMobilePhone(bridePhone)) {
      setError("Gelin telefonu 10 haneli olmalı ve 5 ile başlamalıdır.");
      return;
    }

    if (installmentTotal !== expectedPayable) {
      const confirmed = window.confirm(
        `Ödeme vadeleri toplamı (${formatPrice(installmentTotal)}) beklenen tutarla (${formatPrice(expectedPayable)}) eşleşmiyor. Yine de kaydetmek istiyor musunuz?`,
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError("");

    const payload = {
      brideFirstName,
      brideLastName,
      brideTc: brideTc || undefined,
      bridePhone,
      groomFirstName,
      groomLastName,
      groomTc: groomTc || undefined,
      groomPhone,
      totalPrice,
      cancellationFeeMax,
      discountAmount: discountEnabled ? discountAmount : 0,
      discountEnabled,
      postShoot,
      notes: notes || undefined,
      items: items.map((item) => {
        const outdoor = isOutdoorCategory(
          item.categorySlug,
          findCategoryForOption(item.packageOptionId)?.content ?? {},
        );
        return {
          packageOptionId: item.packageOptionId,
          itemKey: item.itemKey,
          workflowStageTags: postShoot.itemStageTags?.[item.itemKey],
          paymentType: item.paymentType,
          unitPrice: item.unitPrice,
          shootDate: item.shootDate,
          shootContent: item.label,
          readyTime: item.readyTime?.trim() || DEFAULT_READY_TIME,
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
        : `/admin/rezervasyonlar/${data.id}`,
    );
    router.refresh();
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;

  const backHref = isEditing
    ? `/admin/rezervasyonlar/${reservationId}`
    : "/admin/rezervasyonlar";

  const coupleTitle = formatCoupleName(
    joinPersonName(brideFirstName, brideLastName),
    joinPersonName(groomFirstName, groomLastName),
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto min-w-0 max-w-4xl space-y-6">
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
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 break-words">
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
        <div className="space-y-4">
          <div className="grid-safe grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Field label="Damat Ad">
              <PersonNameInput
                value={groomFirstName}
                onChange={setGroomFirstName}
                required
                autoComplete="given-name"
                className={inputClass}
              />
            </Field>
            <Field label="Damat Soyad">
              <PersonNameInput
                value={groomLastName}
                onChange={setGroomLastName}
                required
                autoComplete="family-name"
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
              <PhoneInput
                value={groomPhone}
                onChange={setGroomPhone}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid-safe grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Field label="Gelin Ad">
              <PersonNameInput
                value={brideFirstName}
                onChange={setBrideFirstName}
                required
                autoComplete="given-name"
                className={inputClass}
              />
            </Field>
            <Field label="Gelin Soyad">
              <PersonNameInput
                value={brideLastName}
                onChange={setBrideLastName}
                required
                autoComplete="family-name"
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
              <PhoneInput
                value={bridePhone}
                onChange={setBridePhone}
                required
                className={inputClass}
              />
            </Field>
          </div>

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

                <div className="grid-safe grid gap-3 md:grid-cols-2">
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

      <Section title="3. Süreç Etiketleri">
        <p className="text-sm text-zinc-400">
          Sipariş takibindeki her paket ve süreç adımı için gösterilecek etiketler.
          Paket incele bölümlerinden otomatik doldurulur; bu rezervasyon için
          paket bazında özelleştirebilirsiniz.
          {postShoot.source === "manual" ? (
            <span className="mt-1 block text-amber-300/90">
              Etiketler bu rezervasyon için özelleştirildi.
            </span>
          ) : null}
        </p>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            Etiketleri düzenlemek için önce paket ekleyin.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <ReservationPackageStageTagsEditor
                key={item.itemKey}
                categoryTitle={item.categoryTitle}
                optionLabel={item.label}
                packageOptionId={item.packageOptionId}
                categoryContent={findCategoryForOption(item.packageOptionId)?.content}
                accentColor={item.accentColor}
                stageTags={
                  postShoot.itemStageTags?.[item.itemKey] ??
                  emptyItemWorkflowStageTags()
                }
                onChange={(tags) => updateItemStageTags(item.itemKey, tags)}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => applyPostShootSync(items, true)}
          disabled={items.length === 0}
          className="mt-4 text-sm text-zinc-400 hover:text-white disabled:opacity-40"
        >
          Paket incele etiketlerinden yeniden doldur
        </button>
      </Section>

      <Section title="4. Ödeme Planı">
        <div
          className={`grid-safe grid gap-4 ${
            discountEnabled ? "md:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
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
              type="text"
              readOnly
              value={formatPrice(cancellationFeeMax)}
              className={`${inputClass} cursor-default bg-white/5 text-zinc-300`}
              aria-describedby="cancellation-fee-hint"
            />
            <p id="cancellation-fee-hint" className="mt-1.5 text-xs text-zinc-500">
              Otomatik hesaplanır: {describeCancellationFeeRate(cancellationFeeRate)}
            </p>
          </Field>
          {discountEnabled ? (
            <Field label="İndirim (₺)">
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          ) : null}
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={discountEnabled}
            onChange={(event) => {
              setDiscountEnabled(event.target.checked);
              if (!event.target.checked) {
                setDiscountAmount(0);
              }
            }}
          />
          İndirim uygula
        </label>

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
            <div key={index} className="grid-safe grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto]">
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

        <div className="mt-4 flex min-w-0 gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <p className="min-w-0 flex-1 break-words">{CANCELLATION_POLICY}</p>
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
    <label className="block min-w-0 space-y-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "box-border w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-[#141414] px-4 py-2.5 text-white outline-none focus:border-white/30";
