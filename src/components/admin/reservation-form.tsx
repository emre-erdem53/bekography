"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/constants";

type PackageOption = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  category: { title: string };
};

type SelectedItem = {
  packageOptionId: string;
  paymentType: "pesin" | "taksitli";
  unitPrice: number;
  label: string;
  categoryTitle: string;
};

function ReservationFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [city, setCity] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [allOptions, setAllOptions] = useState<PackageOption[]>([]);
  const [dateConflict, setDateConflict] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const packagesRes = await fetch("/api/admin/packages");
      const packages = await packagesRes.json();
      const options = packages.flatMap(
        (category: { title: string; options: PackageOption[] }) =>
          category.options.map((option) => ({
            ...option,
            category: { title: category.title },
          })),
      );
      setAllOptions(options);

      if (requestId) {
        const requestRes = await fetch(`/api/admin/requests/${requestId}`);
        const request = await requestRes.json();
        setCustomerName(request.customerName);
        setCustomerPhone(request.customerPhone);
        setCity(request.city);
        setShootDate(request.shootDate.split("T")[0]);
        const mapped = request.items.map(
          (item: {
            packageOption: { id: string; label: string; category: { title: string } };
            paymentType: "pesin" | "taksitli";
            unitPrice: number;
          }) => ({
            packageOptionId: item.packageOption.id,
            paymentType: item.paymentType,
            unitPrice: item.unitPrice,
            label: item.packageOption.label,
            categoryTitle: item.packageOption.category.title,
          }),
        );
        setItems(mapped);
        setAgreedPrice(mapped.reduce((sum: number, i: SelectedItem) => sum + i.unitPrice, 0));
      }

      setLoading(false);
    }

    load();
  }, [requestId]);

  useEffect(() => {
    if (!shootDate) {
      setDateConflict(false);
      return;
    }

    fetch("/api/admin/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shootDate }),
    })
      .then((res) => res.json())
      .then((data) => setDateConflict(!data.available));
  }, [shootDate]);

  function addItem(optionId: string) {
    const option = allOptions.find((o) => o.id === optionId);
    if (!option) return;

    const newItem: SelectedItem = {
      packageOptionId: option.id,
      paymentType: "pesin",
      unitPrice: option.cashPrice,
      label: option.label,
      categoryTitle: option.category.title,
    };

    setItems((prev) => [...prev, newItem]);
    setAgreedPrice((prev) => prev + newItem.unitPrice);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      const removed = prev[index];
      setAgreedPrice((price) => price - removed.unitPrice);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (dateConflict) return;

    setSaving(true);
    setError("");

    const response = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: requestId ?? undefined,
        customerName,
        customerPhone,
        city,
        shootDate,
        agreedPrice,
        notes: notes || undefined,
        items: items.map((item) => ({
          packageOptionId: item.packageOptionId,
          paymentType: item.paymentType,
          unitPrice: item.unitPrice,
        })),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Rezervasyon oluşturulamadı");
      if (data.code === "DATE_CONFLICT") setDateConflict(true);
      return;
    }

    const data = await response.json();
    router.push(`/admin/rezervasyonlar/${data.id}`);
  }

  if (loading) return <p className="text-zinc-400">Yükleniyor...</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/rezervasyonlar"
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Rezervasyonlar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Yeni Rezervasyon
        </h1>
      </div>

      {dateConflict ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Bu tarih için zaten bir rezervasyon bulunmaktadır.
        </div>
      ) : null}

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 md:grid-cols-2">
        <Field label="Ad Soyad">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Telefon">
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Şehir">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Çekim Tarihi">
          <input
            type="date"
            value={shootDate}
            onChange={(e) => setShootDate(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Anlaşılan Tutar (₺)">
          <input
            type="number"
            value={agreedPrice}
            onChange={(e) => setAgreedPrice(Number(e.target.value))}
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

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Paketler</h2>
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
            {allOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.category.title} — {option.label}
              </option>
            ))}
          </select>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl bg-white/5 p-4 md:grid-cols-[1fr_auto_auto_auto]"
          >
            <span className="text-sm text-zinc-300">
              {item.categoryTitle} — {item.label}
            </span>
            <select
              value={item.paymentType}
              onChange={(e) => {
                const paymentType = e.target.value as "pesin" | "taksitli";
                const option = allOptions.find((o) => o.id === item.packageOptionId);
                const unitPrice =
                  paymentType === "pesin"
                    ? option!.cashPrice
                    : option!.installmentPrice;
                setItems((prev) => {
                  const next = [...prev];
                  const oldPrice = next[index].unitPrice;
                  next[index] = { ...next[index], paymentType, unitPrice };
                  setAgreedPrice((p) => p - oldPrice + unitPrice);
                  return next;
                });
              }}
              className="rounded-lg border border-white/10 bg-[#141414] px-2 py-1 text-sm text-white"
            >
              <option value="pesin">Peşin</option>
              <option value="taksitli">Taksitli</option>
            </select>
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => {
                const unitPrice = Number(e.target.value);
                setItems((prev) => {
                  const next = [...prev];
                  const oldPrice = next[index].unitPrice;
                  next[index] = { ...next[index], unitPrice };
                  setAgreedPrice((p) => p - oldPrice + unitPrice);
                  return next;
                });
              }}
              className="w-28 rounded-lg border border-white/10 bg-[#141414] px-2 py-1 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-sm text-red-400"
            >
              Kaldır
            </button>
          </div>
        ))}

        <p className="text-right font-semibold text-white">
          Toplam: {formatPrice(agreedPrice)}
        </p>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || dateConflict || items.length === 0}
        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Oluşturuluyor..." : "Rezervasyon Oluştur"}
      </button>
    </form>
  );
}

export function ReservationForm() {
  return <ReservationFormInner />;
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
