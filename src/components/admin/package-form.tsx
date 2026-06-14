"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  PackageCategoryContent,
  PackageDetailSection,
  PackageGalleryImage,
  PackageServiceItem,
} from "@/lib/package-seed-data";
import {
  defaultIndoorPostShootTemplates,
  defaultOutdoorPostShootTemplates,
  defaultRequestFieldLabels,
} from "@/lib/package-seed-data";
import type { PostShootSection } from "@/lib/post-shoot";
import { normalizeHexColor } from "@/lib/color-utils";
import { HexColorInput } from "@/components/admin/hex-color-input";

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
  scheduleType: "indoor",
  postShootTemplates: defaultIndoorPostShootTemplates(),
  highlightTags: [],
  galleryImages: [],
  detailSections: [],
  requestFieldLabels: defaultRequestFieldLabels("Paket", "indoor"),
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
        setAccentColor(normalizeHexColor(data.accentColor) ?? data.accentColor);
        setIconKey(data.iconKey);
        setHighlight(data.highlight);
        setBackgroundImageUrl(data.backgroundImageUrl ?? "");
        setHeroImageUrl(data.heroImageUrl ?? "");
        setSortOrder(data.sortOrder);
        setIsActive(data.isActive);
        const loadedContent = (data.content as PackageCategoryContent) ?? defaultContent;
        setContent({
          ...loadedContent,
          serviceGridColor:
            normalizeHexColor(loadedContent.serviceGridColor) ??
            loadedContent.serviceGridColor,
          serviceTextColor:
            normalizeHexColor(loadedContent.serviceTextColor) ??
            loadedContent.serviceTextColor,
          serviceSubTextColor:
            normalizeHexColor(loadedContent.serviceSubTextColor) ??
            loadedContent.serviceSubTextColor,
          scheduleType: loadedContent.scheduleType ?? "indoor",
          postShootTemplates:
            loadedContent.postShootTemplates ??
            (loadedContent.scheduleType === "outdoor"
              ? defaultOutdoorPostShootTemplates()
              : defaultIndoorPostShootTemplates()),
          highlightTags: loadedContent.highlightTags ?? [],
          galleryImages: loadedContent.galleryImages ?? [],
          detailSections: loadedContent.detailSections ?? [],
          requestFieldLabels:
            loadedContent.requestFieldLabels ??
            defaultRequestFieldLabels(
              data.title,
              loadedContent.scheduleType ?? "indoor",
            ),
        });
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

  async function handleGalleryUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
      setContent({
        ...content,
        galleryImages: [
          ...(content.galleryImages ?? []),
          { url: data.url, alt: title },
        ],
      });
    }
    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const normalizedAccent = normalizeHexColor(accentColor);
    if (!normalizedAccent) {
      setError("Accent renk geçerli bir hex kodu olmalı (örn. #ff9a5e)");
      setSaving(false);
      return;
    }

    const normalizedContent: PackageCategoryContent = {
      ...content,
      serviceGridColor:
        normalizeHexColor(content.serviceGridColor) ?? content.serviceGridColor,
      serviceTextColor:
        normalizeHexColor(content.serviceTextColor) ?? content.serviceTextColor,
      serviceSubTextColor:
        normalizeHexColor(content.serviceSubTextColor) ??
        content.serviceSubTextColor,
      scheduleType: content.scheduleType ?? "indoor",
      postShootTemplates:
        content.postShootTemplates ??
        (content.scheduleType === "outdoor"
          ? defaultOutdoorPostShootTemplates()
          : defaultIndoorPostShootTemplates()),
    };

    const payload = {
      title,
      accentColor: normalizedAccent,
      iconKey,
      highlight,
      backgroundImageUrl: backgroundImageUrl || null,
      heroImageUrl: heroImageUrl || null,
      sortOrder,
      isActive,
      content: normalizedContent,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
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
        <Field label="Accent Renk (#hex)">
          <HexColorInput value={accentColor} onChange={setAccentColor} />
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
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
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Hizmet Kutusu Rengi (#hex)">
            <HexColorInput
              value={content.serviceGridColor}
              onChange={(value) =>
                setContent({ ...content, serviceGridColor: value })
              }
            />
          </Field>
          <Field label="Hizmet Yazı Rengi (#hex)">
            <HexColorInput
              value={content.serviceTextColor}
              onChange={(value) =>
                setContent({ ...content, serviceTextColor: value })
              }
            />
          </Field>
          <Field label="Hizmet Alt Yazı Rengi (#hex)">
            <HexColorInput
              value={content.serviceSubTextColor}
              onChange={(value) =>
                setContent({ ...content, serviceSubTextColor: value })
              }
            />
          </Field>
        </div>
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
        <Field label="Çekim Sonrası Açıklaması (site)">
          <textarea
            value={content.afterShootDescription}
            onChange={(e) =>
              setContent({
                ...content,
                afterShootDescription: e.target.value,
              })
            }
            rows={3}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Paketler sayfasında gösterilen genel metin. Rezervasyon formundaki
            etiketler aşağıdaki şablonlardan gelir.
          </p>
        </Field>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div>
          <h2 className="font-semibold text-white">Müşteri Deneyimi (Mobil)</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Paket detay, İncele ekranı ve sepet/talep formlarında kullanılır.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Görünen Başlık (opsiyonel)">
            <input
              value={content.displayTitle ?? ""}
              onChange={(e) =>
                setContent({ ...content, displayTitle: e.target.value })
              }
              placeholder={title || "Paket adı"}
              className={inputClass}
            />
          </Field>
          <Field label="Çekim Bölüm Başlığı">
            <input
              value={content.shootTitle}
              onChange={(e) =>
                setContent({ ...content, shootTitle: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Çekim Sonrası Bölüm Başlığı">
            <input
              value={content.afterShootTitle}
              onChange={(e) =>
                setContent({ ...content, afterShootTitle: e.target.value })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Galeri fotoğraf rehberi</p>
          <p className="mt-1">
            Önerilen boyut: 1080×1350 px (4:5 dikey), en fazla 2 MB, JPEG veya
            WebP. Dikey odaklı görseller paket detayındaki kaydırmalı galeride
            en iyi görünür.
          </p>
        </div>

        <Field label="Galeri Görselleri">
          <div className="space-y-3">
            {(content.galleryImages ?? []).map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="flex flex-col gap-3 rounded-xl bg-white/5 p-3 sm:flex-row sm:items-center"
              >
                <img
                  src={image.url}
                  alt={image.alt ?? ""}
                  className="h-16 w-12 rounded-lg object-cover"
                />
                <input
                  value={image.alt ?? ""}
                  onChange={(e) => {
                    const next = [...(content.galleryImages ?? [])];
                    next[index] = { ...next[index], alt: e.target.value };
                    setContent({ ...content, galleryImages: next });
                  }}
                  placeholder="Alt metin (opsiyonel)"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.galleryImages ?? []).filter(
                      (_, i) => i !== index,
                    );
                    setContent({ ...content, galleryImages: next });
                  }}
                  className="shrink-0 text-sm text-red-400"
                >
                  Sil
                </button>
              </div>
            ))}
            <input
              type="file"
              accept="image/jpeg,image/webp,image/png"
              onChange={handleGalleryUpload}
              className="text-sm text-zinc-400"
            />
          </div>
        </Field>

        <TagsEditor
          title="Detay Etiketleri"
          tags={content.highlightTags ?? []}
          onChange={(highlightTags) => setContent({ ...content, highlightTags })}
        />

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-medium text-white">İncele Bölümleri</h3>
            <button
              type="button"
              onClick={() => {
                const sections = content.detailSections ?? [];
                setContent({
                  ...content,
                  detailSections: [
                    ...sections,
                    {
                      id: crypto.randomUUID(),
                      title: "",
                      body: "",
                      sortOrder: sections.length,
                    },
                  ],
                });
              }}
              className="text-sm text-zinc-400 hover:text-white"
            >
              + Bölüm Ekle
            </button>
          </div>
          {(content.detailSections ?? [])
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((section, index) => (
              <div
                key={section.id}
                className="space-y-2 rounded-xl border border-white/5 bg-white/5 p-4"
              >
                <input
                  value={section.title}
                  onChange={(e) => {
                    const next = [...(content.detailSections ?? [])];
                    next[index] = { ...next[index], title: e.target.value };
                    setContent({ ...content, detailSections: next });
                  }}
                  placeholder="Başlık"
                  className={inputClass}
                />
                <textarea
                  value={section.body}
                  onChange={(e) => {
                    const next = [...(content.detailSections ?? [])];
                    next[index] = { ...next[index], body: e.target.value };
                    setContent({ ...content, detailSections: next });
                  }}
                  rows={4}
                  placeholder="Açıklama metni"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (content.detailSections ?? []).filter(
                      (_, i) => i !== index,
                    );
                    setContent({ ...content, detailSections: next });
                  }}
                  className="text-sm text-red-400"
                >
                  Bölümü Sil
                </button>
              </div>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Talep Tarih Alanı Etiketi">
            <input
              value={content.requestFieldLabels?.dateLabel ?? ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  requestFieldLabels: {
                    dateLabel: e.target.value,
                    cityLabel:
                      content.requestFieldLabels?.cityLabel ?? "Şehir",
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Talep Şehir Alanı Etiketi">
            <input
              value={content.requestFieldLabels?.cityLabel ?? ""}
              onChange={(e) =>
                setContent({
                  ...content,
                  requestFieldLabels: {
                    dateLabel:
                      content.requestFieldLabels?.dateLabel ?? "Tarih",
                    cityLabel: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>

        <ServicesEditor
          services={content.services}
          onChange={(services) => setContent({ ...content, services })}
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div>
          <h2 className="font-semibold text-white">Çekim Sonrası</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Rezervasyon formunun 3. bölümünde görünecek etiketler ve açıklamalar.
            Her paket için Dijital, Düzenleme ve (salon paketlerinde) Baskı alt
            başlıklarını buradan belirleyin; rezervasyon oluşturulurken seçilen
            paketlere göre otomatik doldurulur.
          </p>
        </div>
        <Field label="Çekim Tipi">
          <select
            value={content.scheduleType ?? "indoor"}
            onChange={(e) => {
              const scheduleType = e.target.value as "outdoor" | "indoor";
              const current =
                content.postShootTemplates ?? defaultIndoorPostShootTemplates();
              setContent({
                ...content,
                scheduleType,
                postShootTemplates: {
                  digital: current.digital,
                  editing: current.editing,
                  ...(scheduleType === "indoor"
                    ? {
                        printing:
                          current.printing ??
                          defaultIndoorPostShootTemplates().printing,
                      }
                    : {}),
                },
              });
            }}
            className={inputClass}
          >
            <option value="indoor">Salon / İç Mekan</option>
            <option value="outdoor">Dış Çekim</option>
          </select>
        </Field>
        <PostShootSectionEditor
          title="Dijital"
          section={content.postShootTemplates?.digital ?? { pills: [], description: "" }}
          onChange={(digital) =>
            setContent({
              ...content,
              postShootTemplates: {
                ...(content.postShootTemplates ??
                  defaultIndoorPostShootTemplates()),
                digital,
              },
            })
          }
        />
        <PostShootSectionEditor
          title="Düzenleme"
          section={content.postShootTemplates?.editing ?? { pills: [], description: "" }}
          onChange={(editing) =>
            setContent({
              ...content,
              postShootTemplates: {
                ...(content.postShootTemplates ??
                  defaultIndoorPostShootTemplates()),
                editing,
              },
            })
          }
        />
        {content.scheduleType !== "outdoor" ? (
          <PostShootSectionEditor
            title="Baskı"
            section={
              content.postShootTemplates?.printing ?? { pills: [], description: "" }
            }
            onChange={(printing) =>
              setContent({
                ...content,
                postShootTemplates: {
                  ...(content.postShootTemplates ??
                    defaultIndoorPostShootTemplates()),
                  printing,
                },
              })
            }
          />
        ) : (
          <p className="text-sm text-zinc-500">
            Dış çekim paketlerinde Baskı şablonu kullanılmaz.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50 sm:w-auto"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

function TagsEditor({
  title,
  tags,
  onChange,
}: {
  title: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const value = input.trim();
    if (!value) return;
    onChange([...tags, value]);
    setInput("");
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, i) => i !== index))}
              className="text-zinc-400 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Etiket ekle..."
          className={inputClass}
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}

function ServicesEditor({
  services,
  onChange,
}: {
  services: PackageServiceItem[];
  onChange: (services: PackageServiceItem[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-white">Hizmet Grid</h3>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...services,
              { title: "", subLines: ["", ""], iconKey: "Camera" },
            ])
          }
          className="text-sm text-zinc-400 hover:text-white"
        >
          + Hizmet Ekle
        </button>
      </div>
      {services.map((service, index) => (
        <div key={index} className="grid gap-2 rounded-xl bg-white/5 p-3 md:grid-cols-4">
          <input
            value={service.title}
            onChange={(e) => {
              const next = [...services];
              next[index] = { ...next[index], title: e.target.value };
              onChange(next);
            }}
            placeholder="Başlık"
            className={inputClass}
          />
          <input
            value={service.iconKey}
            onChange={(e) => {
              const next = [...services];
              next[index] = { ...next[index], iconKey: e.target.value };
              onChange(next);
            }}
            placeholder="Lucide ikon"
            className={inputClass}
          />
          <input
            value={service.subLines.join(", ")}
            onChange={(e) => {
              const next = [...services];
              next[index] = {
                ...next[index],
                subLines: e.target.value.split(",").map((s) => s.trim()),
              };
              onChange(next);
            }}
            placeholder="Alt satırlar (virgülle)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(services.filter((_, i) => i !== index))}
            className="text-sm text-red-400"
          >
            Sil
          </button>
        </div>
      ))}
    </div>
  );
}

function PostShootSectionEditor({
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
          placeholder="Etiket ekle..."
          className={inputClass}
        />
        <button
          type="button"
          onClick={addPill}
          className="shrink-0 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white"
        >
          Ekle
        </button>
      </div>
      <textarea
        value={section.description}
        onChange={(e) => onChange({ ...section, description: e.target.value })}
        rows={3}
        placeholder="Açıklama metni..."
        className={inputClass}
      />
      <p className="text-xs text-zinc-500">
        Etiketleri yazıp Enter veya Ekle ile ekleyin. Rezervasyon formunda bu
        başlık altında görünür.
      </p>
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
