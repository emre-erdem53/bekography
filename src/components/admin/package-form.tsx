"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import type {
  PackageCategoryContent,
  PackageDetailSection,
  PackageGalleryImage,
} from "@/lib/package-seed-data";
import {
  defaultIndoorPostShootTokens,
  defaultOutdoorPostShootTokens,
  defaultRequestFieldLabels,
} from "@/lib/package-seed-data";
import {
  getDefaultPostShootTokensForCategory,
  type PostShootVariableDefinition,
} from "@/lib/post-shoot-template-settings";
import { normalizeHexColor } from "@/lib/color-utils";
import { applyPackageServiceTheme, PACKAGE_SERVICE_THEME } from "@/lib/package-service-theme";
import { normalizeDetailSections } from "@/lib/package-detail-section";
import { HexColorInput } from "@/components/admin/hex-color-input";
import { AdminFileUpload } from "@/components/admin/admin-file-upload";
import { isCustomPackageIcon, PackageIconDisplay } from "@/components/packages/package-icon";
import { packageMediaUrl } from "@/lib/package-media";
import { PAYMENT_TYPE_DESCRIPTIONS } from "@/lib/constants";
import {
  inferOptionIconKey,
  PACKAGE_OPTION_ICON_KEYS,
} from "@/lib/package-option-icon";

const defaultContent: PackageCategoryContent = {
  ...PACKAGE_SERVICE_THEME,
  services: [],
  shootTitle: "Çekim",
  shootDescription: "",
  afterShootTitle: "Çekim Sonrası",
  afterShootDescription: "",
  scheduleType: "indoor",
  postShootTokens: defaultIndoorPostShootTokens(),
  highlightTags: [],
  highlightTagsByOption: {},
  optionIconKeys: {},
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

function removeOptionContentKeys(
  content: PackageCategoryContent,
  option: OptionForm,
  index: number,
) {
  const key = getOptionDetailKey(option, index);
  const labelKey = option.label.trim();
  const nextDetailSections = { ...(content.detailSectionsByOption ?? {}) };
  const nextInspectEnabled = { ...(content.inspectEnabledByOption ?? {}) };
  const nextHighlightTags = { ...(content.highlightTagsByOption ?? {}) };
  const nextOptionIconKeys = { ...(content.optionIconKeys ?? {}) };

  delete nextDetailSections[key];
  delete nextInspectEnabled[key];
  delete nextHighlightTags[key];
  delete nextOptionIconKeys[key];
  if (labelKey) {
    delete nextDetailSections[labelKey];
    delete nextInspectEnabled[labelKey];
    delete nextHighlightTags[labelKey];
    delete nextOptionIconKeys[labelKey];
  }

  return {
    ...content,
    detailSectionsByOption: nextDetailSections,
    inspectEnabledByOption: nextInspectEnabled,
    highlightTagsByOption: nextHighlightTags,
    optionIconKeys: nextOptionIconKeys,
  };
}

function moveGalleryImage(
  images: PackageGalleryImage[],
  index: number,
  direction: -1 | 1,
): PackageGalleryImage[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= images.length) return images;
  const next = [...images];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
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
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState<PackageCategoryContent>(defaultContent);
  const [options, setOptions] = useState<OptionForm[]>([
    { label: "", cashPrice: 0, installmentPrice: 0 },
  ]);
  const [loading, setLoading] = useState(!!packageId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templateVariables, setTemplateVariables] = useState<
    PostShootVariableDefinition[]
  >([]);

  useEffect(() => {
    fetch("/api/admin/post-shoot-templates")
      .then((res) => res.json())
      .then((data) => setTemplateVariables(data.variables ?? []))
      .catch(() => setTemplateVariables([]));
  }, []);

  useEffect(() => {
    if (!packageId) return;

    fetch(`/api/admin/packages/${packageId}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setAccentColor(normalizeHexColor(data.accentColor) ?? data.accentColor);
        setIconKey(data.iconKey);
        setSortOrder(data.sortOrder);
        setIsActive(data.isActive);
        const rawContent =
          (data.content as PackageCategoryContent & {
            tagline?: string;
            displayTitle?: string;
          }) ?? defaultContent;
        const {
          tagline: _legacyTagline,
          displayTitle: _legacyDisplayTitle,
          ...loadedContent
        } = rawContent;
        setContent({
          ...loadedContent,
          ...PACKAGE_SERVICE_THEME,
          scheduleType: loadedContent.scheduleType ?? "indoor",
          postShootTokens: {
            ...getDefaultPostShootTokensForCategory(
              data.slug,
              loadedContent.scheduleType ?? "indoor",
            ),
            ...(loadedContent.postShootTokens ?? {}),
          },
          highlightTags: loadedContent.highlightTags ?? [],
          highlightTagsByOption: loadedContent.highlightTagsByOption ?? {},
          optionIconKeys: loadedContent.optionIconKeys ?? {},
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
    for (const key of Object.keys(detailSectionsByOption)) {
      detailSectionsByOption[key] = normalizeDetailSections(
        detailSectionsByOption[key],
      );
    }
    const inspectEnabledByOption = {
      ...(content.inspectEnabledByOption ?? {}),
    };
    Object.entries(content.inspectEnabledByOption ?? {}).forEach(([key, enabled]) => {
      const mappedKey = optionLabelMap[key];
      if (mappedKey && inspectEnabledByOption[mappedKey] === undefined) {
        inspectEnabledByOption[mappedKey] = enabled;
      }
    });
    const highlightTagsByOption = {
      ...(content.highlightTagsByOption ?? {}),
    };
    Object.entries(content.highlightTagsByOption ?? {}).forEach(([key, tags]) => {
      const mappedKey = optionLabelMap[key];
      if (mappedKey && !highlightTagsByOption[mappedKey]) {
        highlightTagsByOption[mappedKey] = tags;
      }
    });
    const optionIconKeys = {
      ...(content.optionIconKeys ?? {}),
    };
    Object.entries(content.optionIconKeys ?? {}).forEach(([key, icon]) => {
      const mappedKey = optionLabelMap[key];
      if (mappedKey && !optionIconKeys[mappedKey]) {
        optionIconKeys[mappedKey] = icon;
      }
    });

    const {
      tagline: _legacyTagline,
      displayTitle: _legacyDisplayTitle,
      ...contentWithoutLegacy
    } = content as PackageCategoryContent & {
      tagline?: string;
      displayTitle?: string;
    };

    const normalizedContent: PackageCategoryContent = applyPackageServiceTheme({
      ...contentWithoutLegacy,
      detailSectionsByOption,
      inspectEnabledByOption,
      highlightTagsByOption,
      optionIconKeys,
      scheduleType: content.scheduleType ?? "indoor",
      postShootTokens: content.postShootTokens ?? {},
    });

    const payload = {
      title,
      accentColor: normalizedAccent,
      iconKey,
      highlight: false,
      backgroundImageUrl: null,
      heroImageUrl: null,
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
        <Field label="Accent Renk">
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
            Müşterinin paket detay penceresinde gördüğü içerik: görseller,
            etiketler, fiyat satırları ve İncele ekranı.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Galeri fotoğraf rehberi</p>
          <p className="mt-1">
            Önerilen boyut: 1080×1350 px (4:5 dikey), en fazla 2 MB, JPEG veya
            WebP. Dikey odaklı görseller detay penceresindeki galeride en iyi
            görünür.
          </p>
        </div>

        <Field label="Galeri Görselleri">
          <p className="mb-3 text-xs text-zinc-500">
            Sıra, detay penceresindeki kaydırma sırasını belirler. İlk görsel
            ilk sırada gösterilir.
          </p>
          <div className="space-y-3">
            {(content.galleryImages ?? []).map((image, index) => {
              const previewUrl = packageMediaUrl(image.url) ?? image.url;
              const total = content.galleryImages?.length ?? 0;
              return (
                <div
                  key={`${image.url}-${index}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="relative mx-auto shrink-0 sm:mx-0">
                      <img
                        src={previewUrl}
                        alt={image.alt ?? `Görsel ${index + 1}`}
                        className="h-44 w-[8.75rem] rounded-xl object-cover shadow-lg"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            setContent({
                              ...content,
                              galleryImages: moveGalleryImage(
                                content.galleryImages ?? [],
                                index,
                                -1,
                              ),
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          Yukarı
                        </button>
                        <button
                          type="button"
                          disabled={index === total - 1}
                          onClick={() =>
                            setContent({
                              ...content,
                              galleryImages: moveGalleryImage(
                                content.galleryImages ?? [],
                                index,
                                1,
                              ),
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          Aşağı
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (content.galleryImages ?? []).filter(
                              (_, i) => i !== index,
                            );
                            setContent({ ...content, galleryImages: next });
                          }}
                          className="ml-auto text-sm text-red-400 hover:text-red-300"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <AdminFileUpload
              accept="image/jpeg,image/webp,image/png"
              label="Galeriye Görsel Ekle"
              hint="Önerilen 1080×1350 px (4:5), max 2 MB, JPEG/WebP."
              onFileSelect={handleGalleryUpload}
            />
          </div>
        </Field>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Çekim Türleri</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Müşteri pakete tıkladığında açılan menüde görünen seçenekler.
                Her çekim türünün adını, ikonunu, fiyatlarını ve detaylarını
                buradan yönetin.
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
              className="shrink-0 text-sm text-zinc-400 hover:text-white"
            >
              + Çekim Türü Ekle
            </button>
          </div>

          {options.map((option, index) => {
            const key = getOptionDetailKey(option, index);
            const optionLabel =
              option.label.trim() || `Çekim Türü ${index + 1}`;
            const optionTags =
              content.highlightTagsByOption?.[key] ??
              content.highlightTagsByOption?.[option.label.trim()] ??
              [];
            const sections =
              content.detailSectionsByOption?.[key] ??
              content.detailSectionsByOption?.[option.label.trim()] ??
              [];
            const selectedIconKey =
              content.optionIconKeys?.[key] ??
              content.optionIconKeys?.[option.label.trim()] ??
              "";

            return (
              <div
                key={option.id ?? `option-${index}`}
                className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {optionLabel}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Paket listesindeki açılır menüde görünür
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (options.length <= 1) return;
                      setContent(removeOptionContentKeys(content, option, index));
                      setOptions(options.filter((_, i) => i !== index));
                    }}
                    disabled={options.length <= 1}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Kaldır
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                      Tür adı
                    </label>
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
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                      İkon
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                        <PackageIconDisplay
                          iconKey={
                            selectedIconKey || inferOptionIconKey(option.label)
                          }
                          className="h-5 w-5 text-white"
                        />
                      </span>
                      <select
                        value={selectedIconKey}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            optionIconKeys: {
                              ...(content.optionIconKeys ?? {}),
                              [key]: e.target.value,
                            },
                          })
                        }
                        className={inputClass}
                      >
                        <option value="">Otomatik (isme göre)</option>
                        {PACKAGE_OPTION_ICON_KEYS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                      Hemen Ödeme (₺)
                    </label>
                    <p className="mb-2 text-[11px] leading-relaxed text-zinc-600">
                      ({PAYMENT_TYPE_DESCRIPTIONS.pesin})
                    </p>
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
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                      Parçalı Ödeme (₺)
                    </label>
                    <p className="mb-2 text-[11px] leading-relaxed text-zinc-600">
                      ({PAYMENT_TYPE_DESCRIPTIONS.taksitli})
                    </p>
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

                <TagsEditor
                  title="Detay Etiketleri"
                  tags={optionTags}
                  onChange={(tags) =>
                    setContent({
                      ...content,
                      highlightTagsByOption: {
                        ...(content.highlightTagsByOption ?? {}),
                        [key]: tags,
                      },
                    })
                  }
                />

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        İncele içeriği
                      </h4>
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
                        İncele butonu aktif
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
                            tags: [],
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
                      Bu çekim türü için henüz incele metni yok.
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
                            next[sectionIndex] = {
                              ...next[sectionIndex],
                              title: e.target.value,
                            };
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
                        <TagsEditor
                          title="Etiketler"
                          tags={section.tags ?? []}
                          onChange={(tags) => {
                            const next = [...sections];
                            next[sectionIndex] = {
                              ...next[sectionIndex],
                              tags,
                            };
                            setContent({
                              ...content,
                              detailSectionsByOption: {
                                ...(content.detailSectionsByOption ?? {}),
                                [key]: next,
                              },
                            });
                          }}
                        />
                        <textarea
                          value={section.body}
                          onChange={(e) => {
                            const next = [...sections];
                            next[sectionIndex] = {
                              ...next[sectionIndex],
                              body: e.target.value,
                            };
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
                            const next = sections.filter(
                              (_, i) => i !== sectionIndex,
                            );
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
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div>
          <h2 className="font-semibold text-white">İçerik</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Rezervasyon oluşturma formunda kullanılacak metinler. Çekim sonrası
            metinleri global şablondan üretilir; bu paket için yalnızca dinamik
            alan değerleri aşağıda tanımlanır.
          </p>
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
          <p className="mt-1 text-xs text-zinc-500">
            Rezervasyon oluştururken «Çekim İçeriği» alanına varsayılan değer
            olarak gelir.
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
            Rezervasyon detayında referans metin olarak saklanır.
          </p>
        </Field>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <div>
            <h3 className="text-sm font-medium text-white">
              Çekim Sonrası Değişkenleri
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Global şablonda kullanılan dinamik alanlar için bu pakete özel
              değerler. Metinler{" "}
              <Link
                href="/admin/cekim-sonrasi-sablonlari"
                className="text-zinc-300 underline hover:text-white"
              >
                Çekim Sonrası Şablonları
              </Link>{" "}
              sayfasından yönetilir.
            </p>
          </div>

          {templateVariables.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Henüz dinamik alan tanımlanmamış.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templateVariables.map((variable) => (
                <Field key={variable.key} label={variable.label}>
                  <input
                    value={content.postShootTokens?.[variable.key] ?? ""}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        postShootTokens: {
                          ...(content.postShootTokens ?? {}),
                          [variable.key]: e.target.value,
                        },
                      })
                    }
                    placeholder={variable.hint ?? variable.key}
                    className={inputClass}
                  />
                  <p className="mt-1 font-mono text-[11px] text-zinc-500">
                    {`{{${variable.key}}}`}
                  </p>
                </Field>
              ))}
            </div>
          )}
        </div>
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
