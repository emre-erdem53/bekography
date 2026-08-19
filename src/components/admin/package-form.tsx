"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReorderableTagsEditor } from "@/components/admin/reorderable-tags-editor";
import { PostShootTagsEditor } from "@/components/admin/post-shoot-section-editor";
import { PackageWorkflowStagesEditor } from "@/components/admin/package-workflow-stages-editor";
import {
  defaultBuiltinStageDefinitions,
  resolveStageTagsForDefinition,
  resolveWorkflowStagesForOption,
} from "@/lib/package-workflow-stages";
import type {
  PackageCategoryContent,
  PackageDetailSection,
  PackageGalleryMedia,
} from "@/lib/package-seed-data";
import {
  defaultRequestFieldLabels,
} from "@/lib/package-seed-data";
import { applyPackageCopyTransform } from "@/lib/package-copy";
import {
  mergeDefaultPostShootSections,
  STANDARD_INSPECT_SECTION_TITLES,
} from "@/lib/default-inspect-sections";
import { normalizeHexColor } from "@/lib/color-utils";
import { applyPackageServiceTheme, PACKAGE_SERVICE_THEME } from "@/lib/package-service-theme";
import { normalizeDetailSections, resolveDetailSectionsForOption } from "@/lib/package-detail-section";
import { HexColorInput } from "@/components/admin/hex-color-input";
import { AdminFileUpload } from "@/components/admin/admin-file-upload";
import { BlobMediaPickerModal } from "@/components/admin/blob-media-picker-modal";
import { isCustomPackageIcon, PackageIconDisplay } from "@/components/packages/package-icon";
import { packageMediaUrl } from "@/lib/package-media";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import {
  inferOptionIconKey,
  PACKAGE_OPTION_ICON_KEYS,
} from "@/lib/package-option-icon";

const defaultContent: PackageCategoryContent = {
  ...PACKAGE_SERVICE_THEME,
  services: [],
  scheduleType: "indoor",
  highlightTags: [],
  highlightTagsByOption: {},
  optionIconKeys: {},
  galleryImages: [],
  galleryMediaByOption: {},
  detailSections: [],
  detailSectionsByOption: {},
  inspectEnabledByOption: {},
  workflowStageTagsByOption: {},
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
  const nextGalleryMedia = { ...(content.galleryMediaByOption ?? {}) };
  const nextWorkflowStageTags = { ...(content.workflowStageTagsByOption ?? {}) };
  const nextWorkflowStages = { ...(content.workflowStagesByOption ?? {}) };

  delete nextDetailSections[key];
  delete nextInspectEnabled[key];
  delete nextHighlightTags[key];
  delete nextOptionIconKeys[key];
  delete nextGalleryMedia[key];
  delete nextWorkflowStageTags[key];
  delete nextWorkflowStages[key];
  if (labelKey) {
    delete nextDetailSections[labelKey];
    delete nextInspectEnabled[labelKey];
    delete nextHighlightTags[labelKey];
    delete nextOptionIconKeys[labelKey];
    delete nextGalleryMedia[labelKey];
    delete nextWorkflowStageTags[labelKey];
    delete nextWorkflowStages[labelKey];
  }

  return {
    ...content,
    detailSectionsByOption: nextDetailSections,
    inspectEnabledByOption: nextInspectEnabled,
    highlightTagsByOption: nextHighlightTags,
    optionIconKeys: nextOptionIconKeys,
    galleryMediaByOption: nextGalleryMedia,
    workflowStageTagsByOption: nextWorkflowStageTags,
    workflowStagesByOption: nextWorkflowStages,
  };
}

function moveGalleryMedia(
  media: PackageGalleryMedia[],
  index: number,
  direction: -1 | 1,
): PackageGalleryMedia[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= media.length) return media;
  const next = [...media];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function getOptionGalleryList(
  content: PackageCategoryContent,
  key: string,
  optionLabel: string,
): PackageGalleryMedia[] {
  const byOption = content.galleryMediaByOption ?? {};
  if (byOption[key]?.length) return byOption[key];
  if (optionLabel && byOption[optionLabel]?.length) return byOption[optionLabel];
  return [];
}

function setOptionGalleryMedia(
  content: PackageCategoryContent,
  optionKey: string,
  optionLabel: string,
  media: PackageGalleryMedia[],
): PackageCategoryContent {
  const labelKey = optionLabel.trim();
  const nextGalleryMedia = { ...(content.galleryMediaByOption ?? {}) };
  nextGalleryMedia[optionKey] = media;
  if (labelKey && labelKey !== optionKey) {
    nextGalleryMedia[labelKey] = media;
  }
  return {
    ...content,
    galleryMediaByOption: nextGalleryMedia,
  };
}

function setOptionDetailSections(
  content: PackageCategoryContent,
  optionKey: string,
  optionLabel: string,
  sections: PackageDetailSection[],
): PackageCategoryContent {
  const labelKey = optionLabel.trim();
  const nextSections = { ...(content.detailSectionsByOption ?? {}) };
  nextSections[optionKey] = sections;
  if (labelKey && labelKey !== optionKey) {
    nextSections[labelKey] = sections;
  }
  return {
    ...content,
    detailSectionsByOption: nextSections,
  };
}

function buildDetailSectionsByOption(
  content: PackageCategoryContent,
  optionList: OptionForm[],
): Record<string, PackageDetailSection[]> {
  const source = content.detailSectionsByOption ?? {};
  const result: Record<string, PackageDetailSection[]> = {};

  optionList.forEach((option, index) => {
    const primaryKey = getOptionDetailKey(option, index);
    const labelKey = option.label.trim();
    const saveKey = option.id ?? primaryKey;
    const sections = resolveDetailSectionsForOption(
      { detailSectionsByOption: source },
      saveKey,
      labelKey,
    );

    if (!Array.isArray(sections) || sections.length === 0) return;

    const normalized = normalizeDetailSections(sections);
    result[saveKey] = normalized;
    if (labelKey && labelKey !== saveKey) {
      result[labelKey] = normalized;
    }
  });

  return result;
}

function buildGalleryMediaByOption(
  content: PackageCategoryContent,
  optionList: OptionForm[],
): Record<string, PackageGalleryMedia[]> {
  const source = content.galleryMediaByOption ?? {};
  const result: Record<string, PackageGalleryMedia[]> = {};

  optionList.forEach((option, index) => {
    const primaryKey = getOptionDetailKey(option, index);
    const labelKey = option.label.trim();
    const saveKey = option.id ?? primaryKey;
    const media =
      source[saveKey] ??
      source[primaryKey] ??
      (option.id ? source[option.id] : undefined) ??
      (labelKey ? source[labelKey] : undefined) ??
      [];

    if (!Array.isArray(media) || media.length === 0) return;

    result[saveKey] = media;
    if (labelKey && labelKey !== saveKey) {
      result[labelKey] = media;
    }
  });

  return result;
}

export function PackageForm({
  packageId,
  copyFromId,
}: {
  packageId?: string;
  copyFromId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [copySlug, setCopySlug] = useState<string | undefined>();
  const [accentColor, setAccentColor] = useState("#ffffff");
  const [iconKey, setIconKey] = useState("Package");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState<PackageCategoryContent>(defaultContent);
  const [options, setOptions] = useState<OptionForm[]>([
    { label: "", cashPrice: 0, installmentPrice: 0 },
  ]);
  const [loading, setLoading] = useState(!!packageId || !!copyFromId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>(
    {},
  );
  const [blobPickerOptionKey, setBlobPickerOptionKey] = useState<string | null>(
    null,
  );
  const { descriptions: paymentDescriptions } = usePaymentTypeCopy();

  function toggleOptionExpanded(key: string) {
    setExpandedOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  useEffect(() => {
    const sourceId = packageId ?? copyFromId;
    if (!sourceId) return;

    fetch(`/api/admin/packages/${sourceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (copyFromId && !packageId) {
          const copied = applyPackageCopyTransform(data);
          setTitle(copied.title);
          setCopySlug(copied.slug);
          setAccentColor(
            normalizeHexColor(copied.accentColor) ?? copied.accentColor,
          );
          setIconKey(copied.iconKey);
          setSortOrder(copied.sortOrder);
          setIsActive(copied.isActive);
          const loadedContent = copied.content;
          setContent({
            ...loadedContent,
            ...PACKAGE_SERVICE_THEME,
            scheduleType: loadedContent.scheduleType ?? "indoor",
            highlightTags: loadedContent.highlightTags ?? [],
            highlightTagsByOption: loadedContent.highlightTagsByOption ?? {},
            optionIconKeys: loadedContent.optionIconKeys ?? {},
            galleryImages: loadedContent.galleryImages ?? [],
            galleryMediaByOption: loadedContent.galleryMediaByOption ?? {},
            detailSections: loadedContent.detailSections ?? [],
            detailSectionsByOption: loadedContent.detailSectionsByOption ?? {},
            inspectEnabledByOption: loadedContent.inspectEnabledByOption ?? {},
            workflowStageTagsByOption: loadedContent.workflowStageTagsByOption ?? {},
            workflowStages: loadedContent.workflowStages,
            workflowStagesByOption: loadedContent.workflowStagesByOption ?? {},
            requestFieldLabels:
              loadedContent.requestFieldLabels ??
              defaultRequestFieldLabels(
                copied.title,
                loadedContent.scheduleType ?? "indoor",
              ),
          });
          setOptions(
            copied.options.map((option) => ({
              label: option.label,
              cashPrice: option.cashPrice,
              installmentPrice: option.installmentPrice,
            })),
          );
          setExpandedOptions({});
          return;
        }

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
          highlightTags: loadedContent.highlightTags ?? [],
          highlightTagsByOption: loadedContent.highlightTagsByOption ?? {},
          optionIconKeys: loadedContent.optionIconKeys ?? {},
          galleryImages: loadedContent.galleryImages ?? [],
          galleryMediaByOption: loadedContent.galleryMediaByOption ?? {},
          detailSections: loadedContent.detailSections ?? [],
          detailSectionsByOption: loadedContent.detailSectionsByOption ?? {},
          inspectEnabledByOption: loadedContent.inspectEnabledByOption ?? {},
          workflowStageTagsByOption: loadedContent.workflowStageTagsByOption ?? {},
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
        setExpandedOptions({});
      })
      .finally(() => setLoading(false));
  }, [packageId, copyFromId]);

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

  async function handleOptionMediaUpload(
    optionKey: string,
    file: File,
    mediaType: "image" | "video",
  ) {
    const url = await uploadFile(file);
    if (!url) return;

    appendOptionGalleryMedia(optionKey, [{ url, type: mediaType }]);
  }

  function appendOptionGalleryMedia(
    optionKey: string,
    items: Pick<PackageGalleryMedia, "url" | "type">[],
  ) {
    if (items.length === 0) return;

    const optionLabel =
      options.find(
        (option, index) => getOptionDetailKey(option, index) === optionKey,
      )?.label.trim() ?? "";
    const current = getOptionGalleryList(content, optionKey, optionLabel);
    const existingUrls = new Set(current.map((item) => item.url));
    const nextItems = items
      .filter((item) => !existingUrls.has(item.url))
      .map((item) => ({
        url: item.url,
        alt: title,
        type: item.type ?? "image",
      }));

    if (nextItems.length === 0) return;

    setContent(
      setOptionGalleryMedia(content, optionKey, optionLabel, [
        ...current,
        ...nextItems,
      ]),
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim()) {
      setError("Paket başlığı girin.");
      setSaving(false);
      return;
    }

    if (!iconKey.trim()) {
      setError("Paket ikonu seçin veya yükleyin.");
      setSaving(false);
      return;
    }

    const emptyOption = options.find((option) => !option.label.trim());
    if (emptyOption) {
      setError("Tüm çekim türlerine bir ad girin.");
      setSaving(false);
      return;
    }

    const invalidPrice = options.find(
      (option) =>
        !Number.isInteger(option.cashPrice) ||
        option.cashPrice <= 0 ||
        !Number.isInteger(option.installmentPrice) ||
        option.installmentPrice <= 0,
    );
    if (invalidPrice) {
      setError(
        `"${invalidPrice.label.trim()}" çekim türünde hemen ödeme ve parçalı ödeme tutarları 0'dan büyük tam sayı olmalıdır.`,
      );
      setSaving(false);
      return;
    }

    const normalizedAccent = normalizeHexColor(accentColor);
    if (!normalizedAccent) {
      setError("Accent renk geçerli bir hex kodu olmalı (örn. #ff9a5e)");
      setSaving(false);
      return;
    }

    const detailSectionsByOption = buildDetailSectionsByOption(content, options);
    const optionLabelMap = Object.fromEntries(
      options.map((option, index) => [
        option.label.trim(),
        getOptionDetailKey(option, index),
      ]),
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
    const galleryMediaByOption = buildGalleryMediaByOption(content, options);
    const workflowStageTagsByOption = {
      ...(content.workflowStageTagsByOption ?? {}),
    };
    Object.entries(content.workflowStageTagsByOption ?? {}).forEach(
      ([key, tags]) => {
        const mappedKey = optionLabelMap[key];
        if (mappedKey && !workflowStageTagsByOption[mappedKey]) {
          workflowStageTagsByOption[mappedKey] = tags;
        }
      },
    );

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
      galleryMediaByOption,
      workflowStageTagsByOption,
      galleryImages: [],
      scheduleType: content.scheduleType ?? "indoor",
    });

    const payload = {
      title,
      ...(copySlug && !packageId ? { slug: copySlug } : {}),
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
      let data: { error?: string } = {};
      try {
        data = await response.json();
      } catch {
        setError("Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.");
        return;
      }
      setError(data.error ?? "Kayıt başarısız");
      return;
    }

    router.push("/admin/paketler");
    router.refresh();
  }

  if (loading) {
    return <p className="text-zinc-400">Yükleniyor...</p>;
  }

  const blobPickerGallery =
    blobPickerOptionKey !== null
      ? getOptionGalleryList(
          content,
          blobPickerOptionKey,
          options.find(
            (option, index) =>
              getOptionDetailKey(option, index) === blobPickerOptionKey,
          )?.label.trim() ?? "",
        )
      : [];

  return (
    <>
    <form onSubmit={handleSubmit} className="mx-auto min-w-0 max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {packageId ? "Paket Düzenle" : copyFromId ? "Paket Kopyala" : "Yeni Paket"}
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

      <div className="grid-safe grid gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 md:grid-cols-2">
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
            görünür. Kare oranlı, tek renkli veya siyah SVG yükleyin. İkon
            rengi sitede paketin accent renginden gelir; SVG içine sabit renk
            kodu yazmayın. Çok renkli SVG&apos;ler tek renge dönüşür.
          </p>
          {isCustomPackageIcon(iconKey) ? (
            <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <PackageIconDisplay
                iconKey={iconKey}
                className="h-6 w-6 shrink-0"
                style={{ color: accentColor }}
                imageSizes="24px"
              />
              <span className="min-w-0 flex-1 break-all text-xs text-zinc-400">
                {iconKey}
              </span>
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
            hint="Yalnızca .svg dosyaları kabul edilir. Tek renkli veya siyah SVG kullanın; renk accent alanından gelir."
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
            Müşterinin paket detay penceresinde gördüğü içerik: çekim türü
            galerileri (1:1 kare), etiketler, fiyat satırları ve İncele ekranı.
          </p>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Çekim Türleri</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Her çekim türünün galerisi, fiyatı ve detayları birbirinden
                bağımsızdır. Düzenlemek için türü açın.
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
            const optionWorkflowTags =
              content.workflowStageTagsByOption?.[key] ??
              content.workflowStageTagsByOption?.[option.label.trim()] ??
              {};
            const workflowStageDefinitions = resolveWorkflowStagesForOption(
              content,
              key,
              option.label.trim(),
            );
            const sections = resolveDetailSectionsForOption(
              content,
              key,
              option.label.trim(),
            );
            const optionGallery = getOptionGalleryList(content, key, option.label.trim());
            const selectedIconKey =
              content.optionIconKeys?.[key] ??
              content.optionIconKeys?.[option.label.trim()] ??
              "";
            const isExpanded = expandedOptions[key] ?? false;

            return (
              <div
                key={option.id ?? `option-${index}`}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <div className="flex items-start gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => toggleOptionExpanded(key)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown
                      className={`mt-0.5 h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">
                        {optionLabel}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {optionGallery.length} galeri medyası · Hemen ödeme{" "}
                        {option.cashPrice.toLocaleString("tr-TR")} ₺
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (options.length <= 1) return;
                      setContent(removeOptionContentKeys(content, option, index));
                      setOptions(options.filter((_, i) => i !== index));
                      setExpandedOptions((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    disabled={options.length <= 1}
                    className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Kaldır
                  </button>
                </div>

                {isExpanded ? (
                  <div className="space-y-4 border-t border-white/10 p-4 pt-4">
                <div className="grid-safe grid gap-3 md:grid-cols-2">
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
                    <div className="flex min-w-0 items-center gap-3">
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
                        className={`${inputClass} min-w-0 flex-1`}
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

                <div className="grid-safe grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                      Hemen Ödeme (₺)
                    </label>
                    <p className="mb-2 text-[11px] leading-relaxed text-zinc-600">
                      ({paymentDescriptions.pesin})
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
                      ({paymentDescriptions.taksitli})
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

                <ReorderableTagsEditor
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
                  <PackageWorkflowStagesEditor
                    stages={
                      content.workflowStagesByOption?.[key] ??
                      content.workflowStagesByOption?.[option.label.trim()] ??
                      content.workflowStages ??
                      defaultBuiltinStageDefinitions(content.scheduleType)
                    }
                    scheduleType={content.scheduleType ?? "indoor"}
                    onChange={(stages) =>
                      setContent({
                        ...content,
                        workflowStagesByOption: {
                          ...(content.workflowStagesByOption ?? {}),
                          [key]: stages,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      Süreç Etiketleri
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      Müşteri takip sayfasındaki sipariş durumu timeline&apos;ında
                      her aşamada gösterilecek etiketler. İnceleme metinlerinden
                      bağımsızdır.
                    </p>
                  </div>
                  {workflowStageDefinitions.map((stageDef) => (
                    <PostShootTagsEditor
                      key={stageDef.id}
                      title={stageDef.label}
                      tags={
                        resolveStageTagsForDefinition(
                          optionWorkflowTags as Record<string, string[]>,
                          stageDef.id,
                          stageDef.builtinKey,
                        )
                      }
                      onChange={(tags) =>
                        setContent({
                          ...content,
                          workflowStageTagsByOption: {
                            ...(content.workflowStageTagsByOption ?? {}),
                            [key]: {
                              ...optionWorkflowTags,
                              [stageDef.id]: tags,
                            },
                          },
                        })
                      }
                    />
                  ))}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      Galeri Medyaları
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      Yalnızca bu çekim türüne ait görseller ve videolar.
                      Diğer türlerle paylaşılmaz. Tüm medya dosyaları 1:1 kare
                      oranında olmalıdır; detay penceresinde bu oranda
                      gösterilir. Sıra, kaydırma sırasını belirler.
                    </p>
                  </div>
                  {optionGallery.map((media, mediaIndex) => {
                    const previewUrl = packageMediaUrl(media.url) ?? media.url;
                    const isVideo = media.type === "video";
                    const total = optionGallery.length;
                    return (
                      <div
                        key={`${media.url}-${mediaIndex}`}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="relative mx-auto aspect-square h-44 w-44 shrink-0 sm:mx-0">
                            {isVideo ? (
                              <video
                                src={previewUrl}
                                className="h-full w-full rounded-xl object-cover shadow-lg"
                                muted
                                playsInline
                                loop
                                autoPlay
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt={media.alt ?? `Görsel ${mediaIndex + 1}`}
                                className="h-full w-full rounded-xl object-cover shadow-lg"
                              />
                            )}
                            <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
                              {mediaIndex + 1}
                            </span>
                            {isVideo ? (
                              <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white">
                                Video
                              </span>
                            ) : null}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <input
                              value={media.alt ?? ""}
                              onChange={(e) => {
                                const next = [...optionGallery];
                                next[mediaIndex] = {
                                  ...next[mediaIndex],
                                  alt: e.target.value,
                                };
                                setContent(
                                  setOptionGalleryMedia(
                                    content,
                                    key,
                                    option.label.trim(),
                                    next,
                                  ),
                                );
                              }}
                              placeholder="Alt metin (opsiyonel)"
                              className={inputClass}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={mediaIndex === 0}
                                onClick={() =>
                                  setContent(
                                    setOptionGalleryMedia(
                                      content,
                                      key,
                                      option.label.trim(),
                                      moveGalleryMedia(
                                        optionGallery,
                                        mediaIndex,
                                        -1,
                                      ),
                                    ),
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                                Yukarı
                              </button>
                              <button
                                type="button"
                                disabled={mediaIndex === total - 1}
                                onClick={() =>
                                  setContent(
                                    setOptionGalleryMedia(
                                      content,
                                      key,
                                      option.label.trim(),
                                      moveGalleryMedia(
                                        optionGallery,
                                        mediaIndex,
                                        1,
                                      ),
                                    ),
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                                Aşağı
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = optionGallery.filter(
                                    (_, i) => i !== mediaIndex,
                                  );
                                  setContent(
                                    setOptionGalleryMedia(
                                      content,
                                      key,
                                      option.label.trim(),
                                      next,
                                    ),
                                  );
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
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setBlobPickerOptionKey(key)}
                      className="w-full rounded-xl border border-[#93f8b6]/30 bg-[#93f8b6]/10 px-4 py-3 text-sm font-medium text-[#93f8b6] transition-colors hover:bg-[#93f8b6]/15"
                    >
                      Fotoğraf / Video Ekle (Blob Kütüphanesi)
                    </button>
                    <div className="grid-safe grid gap-3 sm:grid-cols-2">
                      <AdminFileUpload
                        accept="image/jpeg,image/webp,image/png"
                        label="Yeni Görsel Yükle"
                        hint="1:1 kare oran zorunludur. Önerilen 1080×1080 px, max 2 MB."
                        onFileSelect={(file) =>
                          handleOptionMediaUpload(key, file, "image")
                        }
                      />
                      <AdminFileUpload
                        accept="video/mp4,video/webm"
                        label="Yeni Video Yükle"
                        hint="1:1 kare oran zorunludur. MP4 veya WebM formatında video."
                        onFileSelect={(file) =>
                          handleOptionMediaUpload(key, file, "video")
                        }
                      />
                    </div>
                  </div>
                </div>

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
                      <p className="mt-1 text-xs text-zinc-500">
                        Sipariş takibindeki çekim sonrası metinleri yalnızca{" "}
                        {STANDARD_INSPECT_SECTION_TITLES.join(", ")} başlıklı
                        bölümlerden üretilir. Diğer bölümler paket detay
                        sayfasında görünür.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setContent(
                            setOptionDetailSections(
                              content,
                              key,
                              option.label.trim(),
                              mergeDefaultPostShootSections(
                                sections,
                                content.scheduleType === "outdoor"
                                  ? "dis-cekim"
                                  : "dugun",
                                content.scheduleType ?? "indoor",
                              ),
                            ),
                          );
                        }}
                        className="text-sm text-zinc-400 hover:text-white"
                      >
                        Çekim sonrası bölümlerini ekle
                      </button>
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
                          setContent(
                            setOptionDetailSections(
                              content,
                              key,
                              option.label.trim(),
                              nextSections,
                            ),
                          );
                        }}
                        className="text-sm text-zinc-400 hover:text-white"
                      >
                        + Bölüm Ekle
                      </button>
                    </div>
                  </div>

                  {sections.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Bu çekim türü için henüz incele metni yok.
                    </p>
                  ) : null}

                  {[...sections]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((section) => (
                      <div
                        key={section.id}
                        className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-4"
                      >
                        <input
                          value={section.title}
                          onChange={(e) => {
                            const next = sections.map((entry) =>
                              entry.id === section.id
                                ? { ...entry, title: e.target.value }
                                : entry,
                            );
                            setContent(
                              setOptionDetailSections(
                                content,
                                key,
                                option.label.trim(),
                                next,
                              ),
                            );
                          }}
                          placeholder="Başlık"
                          className={inputClass}
                        />
                        <ReorderableTagsEditor
                          title="Etiketler"
                          tags={section.tags ?? []}
                          onChange={(tags) => {
                            const next = sections.map((entry) =>
                              entry.id === section.id
                                ? { ...entry, tags }
                                : entry,
                            );
                            setContent(
                              setOptionDetailSections(
                                content,
                                key,
                                option.label.trim(),
                                next,
                              ),
                            );
                          }}
                        />
                        <textarea
                          value={section.body}
                          onChange={(e) => {
                            const next = sections.map((entry) =>
                              entry.id === section.id
                                ? { ...entry, body: e.target.value }
                                : entry,
                            );
                            setContent(
                              setOptionDetailSections(
                                content,
                                key,
                                option.label.trim(),
                                next,
                              ),
                            );
                          }}
                          rows={4}
                          placeholder="Açıklama metni"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = sections.filter(
                              (entry) => entry.id !== section.id,
                            );
                            setContent(
                              setOptionDetailSections(
                                content,
                                key,
                                option.label.trim(),
                                next,
                              ),
                            );
                          }}
                          className="text-sm text-red-400"
                        >
                          Bölümü Sil
                        </button>
                      </div>
                    ))}
                </div>
                  </div>
                ) : null}
              </div>
            );
          })}
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

    <BlobMediaPickerModal
      open={blobPickerOptionKey !== null}
      onClose={() => setBlobPickerOptionKey(null)}
      onSelect={(items) => {
        if (blobPickerOptionKey) {
          appendOptionGalleryMedia(blobPickerOptionKey, items);
        }
      }}
      existingUrls={blobPickerGallery.map(
        (media) => packageMediaUrl(media.url) ?? media.url,
      )}
    />
    </>
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
