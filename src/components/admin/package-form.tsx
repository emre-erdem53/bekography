"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

const defaultContent: PackageCategoryContent = {
  tagline: "",
  serviceGridColor: "#ffffff",
  serviceTextColor: "#111111",
  serviceSubTextColor: "#333333",
  services: [],
  shootTitle: "Çekim",
  shootDescription: "",
  afterShootTitle: "Çekim Sonrası",
  afterShootDescription: "",
};

type OptionForm = {
  id?: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
};

export function PackageForm({
  packageId,
}: {
  packageId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [accentColor, setAccentColor] = useState("#ffffff");
  const [iconKey, setIconKey] = useState("Package");
  const [highlight, setHighlight] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState<PackageCategoryContent>(defaultContent);
  const [options, setOptions] = useState<OptionForm[]>([
    { label: "", cashPrice: 0, installmentPrice: 0 },
  ]);
  const [loading, setLoading] = useState(!!packageId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!packageId) return;

    fetch(`/api/admin/packages/${packageId}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setAccentColor(data.accentColor);
        setIconKey(data.iconKey);
        setHighlight(data.highlight);
        setBackgroundImageUrl(data.backgroundImageUrl ?? "");
        setHeroImageUrl(data.heroImageUrl ?? "");
        setSortOrder(data.sortOrder);
        setIsActive(data.isActive);
        setContent((data.content as PackageCategoryContent) ?? defaultContent);
        setOptions(
          data.options.map(
            (option: {
              id: string;
              label: string;
              cashPrice: number;
              installmentPrice: number;
            }) => ({
              id: option.id,
              label: option.label,
              cashPrice: option.cashPrice,
              installmentPrice: option.installmentPrice,
            }),
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [packageId]);

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      setter(data.url);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title,
      accentColor,
      iconKey,
      highlight,
      backgroundImageUrl: backgroundImageUrl || null,
      heroImageUrl: heroImageUrl || null,
      sortOrder,
      isActive,
      content,
      options: options.map((option, index) => ({
        ...(option.id ? { id: option.id } : {}),
        label: option.label,
        cashPrice: Number(option.cashPrice),
        installmentPrice: Number(option.installmentPrice),
        sortOrder: index,
        isActive: true,
      })),
    };

    const response = await fetch(
      packageId ? `/api/admin/packages/${packageId}` : "/api/admin/packages",
      {
        method: packageId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Kayıt başarısız");
      return;
    }

    router.push("/admin/paketler");
    router.refresh();
  }

  if (loading) {
    return <p className="text-zinc-400">Yükleniyor...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {packageId ? "Paket Düzenle" : "Yeni Paket"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Temel bilgiler ve fiyatlar</p>
        </div>
        <Link
          href="/admin/paketler"
          className="text-sm text-zinc-400 hover:text-white"
        >
          Geri
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 md:grid-cols-2">
        <Field label="Başlık">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Accent Renk">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[#141414]"
          />
        </Field>
        <Field label="İkon (Lucide adı)">
          <input
            value={iconKey}
            onChange={(e) => setIconKey(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Sıra">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Tagline">
          <input
            value={content.tagline}
            onChange={(e) =>
              setContent({ ...content, tagline: e.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Hero Görsel URL">
          <input
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            className={inputClass}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setHeroImageUrl)}
            className="mt-2 text-sm text-zinc-400"
          />
        </Field>
        <Field label="Arka Plan Görsel URL">
          <input
            value={backgroundImageUrl}
            onChange={(e) => setBackgroundImageUrl(e.target.value)}
            className={inputClass}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setBackgroundImageUrl)}
            className="mt-2 text-sm text-zinc-400"
          />
        </Field>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={highlight}
              onChange={(e) => setHighlight(e.target.checked)}
            />
            Öne çıkar
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Aktif
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">İçerik</h2>
        <Field label="Çekim Açıklaması">
          <textarea
            value={content.shootDescription}
            onChange={(e) =>
              setContent({ ...content, shootDescription: e.target.value })
            }
            rows={4}
            className={inputClass}
          />
        </Field>
        <Field label="Çekim Sonrası Açıklaması">
          <textarea
            value={content.afterShootDescription}
            onChange={(e) =>
              setContent({
                ...content,
                afterShootDescription: e.target.value,
              })
            }
            rows={4}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Fiyat Seçenekleri</h2>
          <button
            type="button"
            onClick={() =>
              setOptions([
                ...options,
                { label: "", cashPrice: 0, installmentPrice: 0 },
              ])
            }
            className="text-sm text-zinc-400 hover:text-white"
          >
            + Seçenek Ekle
          </button>
        </div>
        {options.map((option, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-3">
            <input
              placeholder="Etiket"
              value={option.label}
              onChange={(e) => {
                const next = [...options];
                next[index] = { ...next[index], label: e.target.value };
                setOptions(next);
              }}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Peşin"
              value={option.cashPrice}
              onChange={(e) => {
                const next = [...options];
                next[index] = {
                  ...next[index],
                  cashPrice: Number(e.target.value),
                };
                setOptions(next);
              }}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Taksitli"
              value={option.installmentPrice}
              onChange={(e) => {
                const next = [...options];
                next[index] = {
                  ...next[index],
                  installmentPrice: Number(e.target.value),
                };
                setOptions(next);
              }}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
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
