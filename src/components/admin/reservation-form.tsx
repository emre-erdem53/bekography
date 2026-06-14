"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Plus, X } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import {
  isOutdoorCategory,
  mergePostShootTemplates,
  parsePostShootSnapshot,
  shouldShowPrintingSection,
  type PostShootSection,
  type PostShootSnapshot,
} from "@/lib/post-shoot";
import { formatCoupleName } from "@/lib/reservations";

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

type ReservationFormProps = {
  reservationId?: string;
};

const CANCELLATION_POLICY =
  "30 günden fazla süre kalan bir çekimi iptal eden taraf karşı tarafa toplam ücretin %50'sini cayma bedeli olarak öder. 30 günden daha az bir süre varsa bu oran %75'tir. Sözleşmedeki mücbir sebeplerle iptal olursa oran %25'tir.";

export function ReservationForm({ reservationId }: ReservationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const isEditing = Boolean(reservationId);

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
  const [postShoot, setPostShoot] = useState<PostShootSnapshot>({
    digital: { pills: [], description: "" },
    editing: { pills: [], description: "" },
  });
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [dateConflicts, setDateConflicts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPriceManual, setTotalPriceManual] = useState(false);

  const showPrinting = useMemo(
    () =>
      shouldShowPrintingSection(
        items.map((item) => {
          const category = categories.find((c) =>
            c.options.some((o) => o.id === item.packageOptionId),
          );
          return {
            slug: item.categorySlug,
            content: category?.content ?? {},
          };
        }),
      ),
    [items, categories],
  );

  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.agreedUnitPrice, 0),
    [items],
  );

  const installmentTotal = useMemo(
    () => installments.reduce((sum, row) => sum + row.amount, 0),
    [installments],
  );

  const expectedPayable = totalPrice - discountAmount;

  const refreshPostShootFromItems = useCallback(
    (nextItems: SelectedItem[]) => {
      const selectedCategories = nextItems
        .map((item) => {
          const category = categories.find((c) =>
            c.options.some((o) => o.id === item.packageOptionId),
          );
          if (!category) return null;
          return { slug: category.slug, content: category.content };
        })
        .filter(Boolean) as { slug: string; content: PackageCategoryContent }[];

      if (selectedCategories.length === 0) {
        setPostShoot({
          digital: { pills: [], description: "" },
          editing: { pills: [], description: "" },
        });
        return;
      }

      setPostShoot(mergePostShootTemplates(selectedCategories));
    },
    [categories],
  );

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
        setGroomPhone(request.customerPhone);
        const defaultDate = request.shootDate.split("T")[0];
        const mapped: SelectedItem[] = request.items.map(
          (item: {
            packageOption: {
              id: string;
              label: string;
              category: {
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
              paymentType: item.paymentType,
              unitPrice: item.unitPrice,
              label: item.packageOption.label,
              categoryTitle: item.packageOption.category.title,
              categorySlug: item.packageOption.category.slug,
              accentColor: item.packageOption.category.accentColor,
              shootDate: defaultDate,
              shootContent: item.packageOption.label,
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
        setInstallments([
          { amount: Math.floor(total / 2), dueDate: "" },
          { amount: total - Math.floor(total / 2), dueDate: "" },
        ]);
      }

      setLoading(false);
    }

    load();
  }, [requestId, reservationId]);

  useEffect(() => {
    if (categories.length === 0 || reservationId || items.length === 0) return;
    if (!requestId) return;
    refreshPostShootFromItems(items);
  }, [categories, requestId, reservationId, items, refreshPostShootFromItems]);

  useEffect(() => {
    if (!totalPriceManual && items.length > 0) {
      setTotalPrice(itemsTotal);
    }
  }, [itemsTotal, items.length, totalPriceManual]);

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

    const outdoor = isOutdoorCategory(category.slug, category.content);
    const newItem: SelectedItem = {
      packageOptionId: option.id,
      paymentType: "pesin",
      unitPrice: option.cashPrice,
      label: option.label,
      categoryTitle: category.title,
      categorySlug: category.slug,
      accentColor: category.accentColor,
      shootDate: "",
      shootContent: option.label,
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
    refreshPostShootFromItems(nextItems);

    if (!outdoor) {
      // no-op, fields initialized empty
    }
  }

  function removeItem(index: number) {
    const nextItems = items.filter((_, i) => i !== index);
    setItems(nextItems);
    refreshPostShootFromItems(nextItems);
  }

  function updateItem(index: number, patch: Partial<SelectedItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function updatePostShootSection(
    key: keyof PostShootSnapshot,
    section: PostShootSection,
  ) {
    setPostShoot((prev) => ({ ...prev, [key]: section }));
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
      postShoot: showPrinting
        ? postShoot
        : { digital: postShoot.digital, editing: postShoot.editing },
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
    router.push(`/admin/rezervasyonlar/${isEditing ? reservationId : data.id}`);
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
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {isEditing ? `${coupleTitle} — Düzenle` : "Yeni Rezervasyon"}
        </h1>
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
        <div className="mb-4 flex justify-end">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addItem(e.target.value);
                e.target.value = "";
              }
            }}
            className="rounded-lg border border-white/10 bg-[#141414] px-3 py-2 text-sm text-white"
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
                      value={item.readyTime}
                      onChange={(e) =>
                        updateItem(index, { readyTime: e.target.value })
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
                      <option value="pesin">Peşin</option>
                      <option value="taksitli">Taksitli</option>
                    </select>
                  </Field>

                  {outdoor ? (
                    <>
                      <Field label="Rize'den Çıkış">
                        <input
                          type="time"
                          value={item.departureTime}
                          onChange={(e) =>
                            updateItem(index, { departureTime: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Rize'ye Varış">
                        <input
                          type="time"
                          value={item.arrivalTime}
                          onChange={(e) =>
                            updateItem(index, { arrivalTime: e.target.value })
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
                          value={item.startTime}
                          onChange={(e) =>
                            updateItem(index, { startTime: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Bitiş">
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) =>
                            updateItem(index, { endTime: e.target.value })
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
        <PostShootEditor
          title="Dijital"
          section={postShoot.digital}
          onChange={(section) => updatePostShootSection("digital", section)}
        />
        <PostShootEditor
          title="Düzenleme"
          section={postShoot.editing}
          onChange={(section) => updatePostShootSection("editing", section)}
        />
        {showPrinting ? (
          <PostShootEditor
            title="Baskı"
            section={
              postShoot.printing ?? { pills: [], description: "" }
            }
            onChange={(section) => updatePostShootSection("printing", section)}
          />
        ) : null}
        <button
          type="button"
          onClick={() => refreshPostShootFromItems(items)}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Paket şablonlarından yeniden doldur
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Ödeme Vadeleri</h3>
            <button
              type="button"
              onClick={() =>
                setInstallments((prev) => [...prev, { amount: 0, dueDate: "" }])
              }
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Vade Ekle
            </button>
          </div>
          {installments.map((row, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Field label={`Ödenecek Tutar ${index + 1} (₺)`}>
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...installments];
                    next[index] = { ...next[index], amount: Number(e.target.value) };
                    setInstallments(next);
                  }}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Vade Tarihi">
                <input
                  type="date"
                  value={row.dueDate}
                  onChange={(e) => {
                    const next = [...installments];
                    next[index] = { ...next[index], dueDate: e.target.value };
                    setInstallments(next);
                  }}
                  required
                  className={inputClass}
                />
              </Field>
              {installments.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setInstallments((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="mt-6 rounded-lg p-2 text-zinc-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
          <p className="text-sm text-zinc-400">
            Beklenen ödeme: {formatPrice(expectedPayable)} — Vade toplamı:{" "}
            {formatPrice(installmentTotal)}
          </p>
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
        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
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

function PostShootEditor({
  title,
  section,
  onChange,
}: {
  title: string;
  section: PostShootSection;
  onChange: (section: PostShootSection) => void;
}) {
  const [pillInput, setPillInput] = useState("");

  function addPill() {
    const value = pillInput.trim();
    if (!value) return;
    onChange({ ...section, pills: [...section.pills, value] });
    setPillInput("");
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {section.pills.map((pill, index) => (
          <span
            key={`${pill}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
          >
            {pill}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...section,
                  pills: section.pills.filter((_, i) => i !== index),
                })
              }
              className="text-zinc-400 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={pillInput}
          onChange={(e) => setPillInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPill();
            }
          }}
          placeholder="Pill ekle..."
          className={inputClass}
        />
        <button
          type="button"
          onClick={addPill}
          className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300"
        >
          Ekle
        </button>
      </div>
      <textarea
        value={section.description}
        onChange={(e) => onChange({ ...section, description: e.target.value })}
        rows={3}
        className={inputClass}
      />
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
