"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  PackageCategoryContent,
  PackageDetailSection,
  PackageGalleryImage,
} from "@/lib/package-seed-data";
import {
  defaultIndoorPostShootTemplates,
  defaultOutdoorPostShootTemplates,
  defaultRequestFieldLabels,
} from "@/lib/package-seed-data";
import type { PostShootSection } from "@/lib/post-shoot";
import { normalizeHexColor } from "@/lib/color-utils";
import { applyPackageServiceTheme, PACKAGE_SERVICE_THEME } from "@/lib/package-service-theme";
import { HexColorInput } from "@/components/admin/hex-color-input";
import { AdminFileUpload } from "@/components/admin/admin-file-upload";
import { isCustomPackageIcon } from "@/components/packages/package-icon";
import { packageMediaUrl } from "@/lib/package-media";

const defaultContent: PackageCategoryContent = {
  tagline: "",
  ...PACKAGE_SERVICE_THEME,
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
  detailSectionsByOption: {},
  inspectEnabledByOption: {},
  requestFieldLabels: defaultRequestFieldLabels("Paket", "indoor"),
};

type OptionForm = {
  id?: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
};

function getOptionDetailKey(option: OptionForm, index: number) {
  if (option.id) return option.id;
  const label = option.label.trim();
  return label || `option-${index}`;
}

export function PackageForm({
  packageId,
}: {
  packageId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [accentColor, setAccentColor] = useState("#ffffff");
  const [iconKey, setIconKey] = useState("Package");
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
        setHeroImageUrl(data.heroImageUrl ?? "");
        setSortOrder(data.sortOrder);
        setIsActive(data.isActive);
        const loadedContent = (data.content as PackageCategoryContent) ?? defaultContent;
        setContent({
          ...loadedContent,
          ...PACKAGE_SERVICE_THEME,
          scheduleType: loadedContent.scheduleType ?? "indoor",
          postShootTemplates:
            loadedContent.postShootTemplates ??
            (loadedContent.scheduleType === "outdoor"
              ? defaultOutdoorPostShootTemplates()
              : defaultIndoorPostShootTemplates()),
          highlightTags: loadedContent.highlightTags ?? [],
          galleryImages: loadedContent.galleryImages ?? [],
          detailSections: loadedContent.detailSections ?? [],
          detailSectionsByOption: loadedContent.detailSectionsByOption ?? {},
          inspectEnabledByOption: loadedContent.inspectEnabledByOption ?? {},
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

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setError("Dosya yüklenemedi");
      return null;
    }

    const data = await response.json();
    return data.url as string;
  }

  async function handleImageUpload(
    file: File,
    setter: (url: string) => void,
  ) {
    const url = await uploadFile(file);
    if (url) setter(url);
  }

  async function handleIconUpload(file: File) {
    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) {
      setError("Paket ikonu yalnızca SVG formatında olabilir");
      return;
    }

    const url = await uploadFile(file);
    if (url) setIconKey(url);
  }

  async function handleGalleryUpload(file: File) {
    const url = await uploadFile(file);
    if (!url) return;

    setContent({
      ...content,
      galleryImages: [
        ...(content.galleryImages ?? []),
        { url, alt: title },
      ],
    });
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

    const detailSectionsByOption = {
      ...(content.detailSectionsByOption ?? {}),
    };
    const optionLabelMap = Object.fromEntries(
      options.map((option, index) => [option.label.trim(), getOptionDetailKey(option, index)]),
    );
    Object.entries(content.detailSectionsByOption ?? {}).forEach(
      ([key, sections]) => {
        const mappedKey = optionLabelMap[key];
        if (mappedKey && !detailSectionsByOption[mappedKey]) {
          detailSectionsByOption[mappedKey] = sections;
        }
      },
    );
    const inspectEnabledByOption = {
      ...(content.inspectEnabledByOption ?? {}),
    };
    Object.entries(content.inspectEnabledByOption ?? {}).forEach(([key, enabled]) => {
      const mappedKey = optionLabelMap[key];
      if (mappedKey && inspectEnabledByOption[mappedKey] === undefined) {
        inspectEnabledByOption[mappedKey] = enabled;
      }
    });

    const normalizedContent: PackageCategoryContent = applyPackageServiceTheme({
      ...content,
      detailSectionsByOption,
      inspectEnabledByOption,
      scheduleType: content.scheduleType ?? "indoor",
      postShootTemplates:
        content.postShootTemplates ??
        (content.scheduleType === "outdoor"
          ? defaultOutdoorPostShootTemplates()
          : defaultIndoorPostShootTemplates()),
    });

    const payload = {
      title,
      accentColor: normalizedAccent,
      iconKey,
      highlight: false,
      backgroundImageUrl: null,
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
          <p className="mt-1 text-sm text-zinc-400">Temel bilgiler</p>
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
        <Field label="Paket İkonu (SVG)">
          <p className="mb-2 text-xs leading-relaxed text-zinc-500">
            Paket listesinde 20×20 px (mobil) ve 24×24 px (masaüstü) ölçülerinde
            görünür. Kare oranlı, sade SVG yükleyin.
          </p>
          {isCustomPackageIcon(iconKey) ? (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <img
                src={packageMediaUrl(iconKey) ?? iconKey}
                alt=""
                className="h-6 w-6 object-contain"
              />
              <span className="truncate text-xs text-zinc-400">{iconKey}</span>
            </div>
          ) : (
            <p className="mb-3 text-xs text-zinc-500">
              Mevcut sistem ikonu: <span className="text-zinc-300">{iconKey}</span>
            </p>
          )}
          <AdminFileUpload
            accept=".svg,image/svg+xml"
            label="SVG İkon Yükle"
            fileLabel={isCustomPackageIcon(iconKey) ? "İkonu Değiştir" : undefined}
            hint="Yalnızca .svg dosyaları kabul edilir."
            onFileSelect={handleIconUpload}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Aktif (sitede göster)
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div>
          <h2 className="font-semibold text-white">Paket Detayı</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Müşterinin paket detay penceresinde gördüğü içerik: başlık, görseller,
            etiketler, fiyat satırları ve İncele ekranı.
          </p>
        </div>

        <Field label="Görünen Başlık (opsiyonel)">
          <input
            value={content.displayTitle ?? ""}
            onChange={(e) =>
              setContent({ ...content, displayTitle: e.target.value })
            }
            placeholder={title || "Paket adı"}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Boş bırakılırsa üstteki «Başlık» kullanılır. Detay penceresinin üst
            başlığıdır.
          </p>
        </Field>

        <Field label="Ana Görsel (Hero)">
          <p className="mb-2 text-xs leading-relaxed text-zinc-500">
            Galeri boşsa detay penceresindeki kaydırmalı alanda gösterilir.
            Sepette küçük önizleme olarak da kullanılır.
          </p>
          {heroImageUrl ? (
            <p className="mb-2 truncate text-xs text-zinc-400">{heroImageUrl}</p>
          ) : null}
          <AdminFileUpload
            accept="image/jpeg,image/webp,image/png"
            label="Ana Görsel Yükle"
            fileLabel={heroImageUrl ? "Görseli Değiştir" : undefined}
            hint="Önerilen: dikey 4:5 oran, JPEG veya WebP."
            onFileSelect={(file) => handleImageUpload(file, setHeroImageUrl)}
          />
        </Field>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Galeri fotoğraf rehberi</p>
          <p className="mt-1">
            Önerilen boyut: 1080×1350 px (4:5 dikey), en fazla 2 MB, JPEG veya
            WebP. Dikey odaklı görseller detay penceresindeki galeride en iyi
            görünür.
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
            <AdminFileUpload
              accept="image/jpeg,image/webp,image/png"
              label="Galeriye Görsel Ekle"
              hint="Önerilen 1080×1350 px (4:5), max 2 MB, JPEG/WebP."
              onFileSelect={handleGalleryUpload}
            />
          </div>
        </Field>

        <TagsEditor
          title="Detay Etiketleri"
          tags={content.highlightTags ?? []}
          onChange={(highlightTags) => setContent({ ...content, highlightTags })}
        />

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white">
              İncele Bölümleri (Seçenek Bazlı)
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Her fiyat seçeneği için farklı «İncele» metni girebilirsiniz.
            </p>
          </div>
          {options.map((option, optionIndex) => {
            const optionLabel = option.label.trim() || `Seçenek ${optionIndex + 1}`;
            const key = getOptionDetailKey(option, optionIndex);
            const sections =
              content.detailSectionsByOption?.[key] ??
              content.detailSectionsByOption?.[option.label.trim()] ??
              [];

            return (
              <div
                key={`${key}-${optionIndex}`}
                className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{optionLabel}</p>
                    <label className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={content.inspectEnabledByOption?.[key] ?? true}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            inspectEnabledByOption: {
                              ...(content.inspectEnabledByOption ?? {}),
                              [key]: e.target.checked,
                            },
                          })
                        }
                      />
                      İncele aktif
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSections = [
                        ...sections,
                        {
                          id: crypto.randomUUID(),
                          title: "",
                          body: "",
                          sortOrder: sections.length,
                        },
                      ];
                      setContent({
                        ...content,
                        detailSectionsByOption: {
                          ...(content.detailSectionsByOption ?? {}),
                          [key]: nextSections,
                        },
                      });
                    }}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    + Bölüm Ekle
                  </button>
                </div>

                {sections.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Bu seçenek için henüz incele metni yok.
                  </p>
                ) : null}

                {[...sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-4"
                    >
                      <input
                        value={section.title}
                        onChange={(e) => {
                          const next = [...sections];
                          next[sectionIndex] = { ...next[sectionIndex], title: e.target.value };
                          setContent({
                            ...content,
                            detailSectionsByOption: {
                              ...(content.detailSectionsByOption ?? {}),
                              [key]: next,
                            },
                          });
                        }}
                        placeholder="Başlık"
                        className={inputClass}
                      />
                      <textarea
                        value={section.body}
                        onChange={(e) => {
                          const next = [...sections];
                          next[sectionIndex] = { ...next[sectionIndex], body: e.target.value };
                          setContent({
                            ...content,
                            detailSectionsByOption: {
                              ...(content.detailSectionsByOption ?? {}),
                              [key]: next,
                            },
                          });
                        }}
                        rows={4}
                        placeholder="Açıklama metni"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = sections.filter((_, i) => i !== sectionIndex);
                          setContent({
                            ...content,
                            detailSectionsByOption: {
                              ...(content.detailSectionsByOption ?? {}),
                              [key]: next,
                            },
                          });
                        }}
                        className="text-sm text-red-400"
                      >
                        Bölümü Sil
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Fiyat Seçenekleri</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Detay penceresindeki satırlar (ör. Fotoğraf, Fotoğraf + Video).
                Peşin ve taksitli fiyatlar buradan gelir.
              </p>
            </div>
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
          <div className="hidden gap-3 px-1 md:grid md:grid-cols-3">
            <span className="text-xs font-medium text-zinc-500">Seçenek Etiketi</span>
            <span className="text-xs font-medium text-zinc-500">Peşin (₺)</span>
            <span className="text-xs font-medium text-zinc-500">Taksitli (₺)</span>
          </div>
          {options.map((option, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 md:grid-cols-3 md:rounded-none md:border-0 md:bg-transparent md:p-0"
            >
              <div>
                <span className="mb-1.5 block text-sm text-zinc-400 md:hidden">
                  Seçenek Etiketi
                </span>
                <input
                  placeholder="örn. Fotoğraf"
                  value={option.label}
                  onChange={(e) => {
                    const next = [...options];
                    next[index] = { ...next[index], label: e.target.value };
                    setOptions(next);
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <span className="mb-1.5 block text-sm text-zinc-400 md:hidden">
                  Peşin (₺)
                </span>
                <input
                  type="number"
                  min={0}
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
              </div>
              <div>
                <span className="mb-1.5 block text-sm text-zinc-400 md:hidden">
                  Taksitli (₺)
                </span>
                <input
                  type="number"
                  min={0}
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
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <h2 className="font-semibold text-white">
          İçerik{" "}
          <span className="font-normal text-sm text-zinc-400">
            (Bu alana girilecek olan metinler rezervasyon oluşturma formunda
            kullanılmak üzere girilecektir.)
          </span>
        </h2>
        <Field label="Çekim Açıklaması">
          <textarea
            value={content.shootDescription}
            onChange={(e) =>
              setContent({ ...content, shootDescription: e.target.value })
            }
            rows={4}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Rezervasyon oluştururken «Çekim İçeriği» alanına varsayılan değer
            olarak gelir. Sitede gösterilmez.
          </p>
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
            rows={3}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Rezervasyon detayında referans metin olarak saklanır. Sitede
            gösterilmez.
          </p>
        </Field>
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
