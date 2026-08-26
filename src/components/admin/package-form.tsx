"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReorderableTagsEditor } from "@/components/admin/reorderable-tags-editor";
import { PostShootTagsEditor } from "@/components/admin/post-shoot-section-editor";
import { PackageWorkflowStagesEditor } from "@/components/admin/package-workflow-stages-editor";
import {
  resolveStageTagsForDefinition,
  resolveWorkflowStages,
} from "@/lib/package-workflow-stages";
import type {
  PackageDetailSection,
  PackageGalleryMedia,
  ShootTypeContent,
} from "@/lib/package-seed-data";
import { applyPackageCopyTransform } from "@/lib/package-copy";
import {
  mergeDefaultPostShootSections,
  STANDARD_INSPECT_SECTION_TITLES,
} from "@/lib/default-inspect-sections";
import { normalizeDetailSections } from "@/lib/package-detail-section";
import type { ScheduleType } from "@/lib/package-types";
import { AdminFileUpload } from "@/components/admin/admin-file-upload";
import { HexColorInput } from "@/components/admin/hex-color-input";
import { BlobMediaPickerModal } from "@/components/admin/blob-media-picker-modal";
import {
  isCustomPackageIcon,
  PackageIconDisplay,
} from "@/components/packages/package-icon";
import { packageMediaUrl } from "@/lib/package-media";
import { normalizeHexColor } from "@/lib/color-utils";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";
import {
  inferOptionIconKey,
  PACKAGE_OPTION_ICON_KEYS,
} from "@/lib/package-option-icon";
import { MAX_HIERARCHY_TAGS } from "@/lib/validations";

type ShootTypeForm = {
  /** Mevcut satırın id'si; yeni eklenenlerde yok. */
  id?: string;
  /** Accordion durumu ve React key'i için stabil istemci anahtarı. */
  key: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  iconKey: string;
  tags: string[];
  content: ShootTypeContent;
};

type ServiceAreaOption = {
  id: string;
  title: string;
  slug: string;
  accentColor: string;
  scheduleType: ScheduleType;
  isActive: boolean;
};

type PackageFormEntry = {
  id?: string;
  key: string;
  title: string;
  slug: string;
  accentColor: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  tags: string[];
  shootTypes: ShootTypeForm[];
};

type ApiShootType = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  iconKey: string | null;
  sortOrder: number;
  tags: string[];
  content: ShootTypeContent | null;
};

type ApiPackage = {
  id: string;
  title: string;
  slug: string;
  accentColor: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
  tags: string[];
  shootTypes: ApiShootType[];
};

let shootTypeKeyCounter = 0;
function nextShootTypeKey() {
  shootTypeKeyCounter += 1;
  return `st-${shootTypeKeyCounter}`;
}

let packageKeyCounter = 0;
function nextPackageKey() {
  packageKeyCounter += 1;
  return `pkg-${packageKeyCounter}`;
}

function emptyShootType(): ShootTypeForm {
  return {
    key: nextShootTypeKey(),
    label: "",
    cashPrice: 0,
    installmentPrice: 0,
    iconKey: "",
    tags: [],
    content: { galleryMedia: [], detailSections: [], inspectEnabled: true },
  };
}

function emptyPackage(accentColor = "#ffffff"): PackageFormEntry {
  return {
    key: nextPackageKey(),
    title: "",
    slug: "",
    accentColor,
    iconKey: "",
    sortOrder: 0,
    isActive: true,
    tags: [],
    shootTypes: [emptyShootType()],
  };
}

function mapApiPackage(
  pkg: ApiPackage,
  fallbackAccentColor = "#ffffff",
): PackageFormEntry {
  return {
    id: pkg.id,
    key: pkg.id,
    title: pkg.title,
    slug: pkg.slug,
    accentColor:
      normalizeHexColor(pkg.accentColor ?? "") ??
      pkg.accentColor ??
      fallbackAccentColor,
    iconKey: pkg.iconKey ?? "",
    sortOrder: pkg.sortOrder,
    isActive: pkg.isActive,
    tags: pkg.tags ?? [],
    shootTypes:
      pkg.shootTypes.length > 0
        ? pkg.shootTypes.map((shootType) => ({
            id: shootType.id,
            key: shootType.id,
            label: shootType.label,
            cashPrice: shootType.cashPrice,
            installmentPrice: shootType.installmentPrice,
            iconKey: shootType.iconKey ?? "",
            tags: shootType.tags ?? [],
            content: (shootType.content ?? {}) as ShootTypeContent,
          }))
        : [emptyShootType()],
  };
}

function serializeShootTypes(shootTypes: ShootTypeForm[]) {
  return shootTypes.map((shootType, index) => ({
    ...(shootType.id ? { id: shootType.id } : {}),
    label: shootType.label.trim(),
    cashPrice: Number(shootType.cashPrice),
    installmentPrice: Number(shootType.installmentPrice),
    iconKey: shootType.iconKey || null,
    sortOrder: index,
    isActive: true,
    tags: shootType.tags,
    content: {
      galleryMedia: shootType.content.galleryMedia ?? [],
      detailSections: normalizeDetailSections(shootType.content.detailSections),
      inspectEnabled: shootType.content.inspectEnabled ?? true,
      ...(shootType.content.workflowStages
        ? { workflowStages: shootType.content.workflowStages }
        : {}),
      ...(shootType.content.workflowStageTags
        ? { workflowStageTags: shootType.content.workflowStageTags }
        : {}),
    },
  }));
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

export function PackageForm({
  packageId,
  copyFromId,
  preselectedServiceAreaId,
}: {
  packageId?: string;
  copyFromId?: string;
  preselectedServiceAreaId?: string;
}) {
  const router = useRouter();
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaOption[]>([]);
  const [serviceAreaId, setServiceAreaId] = useState(
    preselectedServiceAreaId ?? "",
  );
  const [packages, setPackages] = useState<PackageFormEntry[]>([
    emptyPackage(),
  ]);
  const [loading, setLoading] = useState(
    Boolean(packageId || copyFromId || preselectedServiceAreaId),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedPackages, setExpandedPackages] = useState<
    Record<string, boolean>
  >({});
  const [expandedShootTypes, setExpandedShootTypes] = useState<
    Record<string, boolean>
  >({});
  const [blobPickerKey, setBlobPickerKey] = useState<string | null>(null);
  const { descriptions: paymentDescriptions } = usePaymentTypeCopy();

  useEffect(() => {
    fetch("/api/admin/service-areas")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setServiceAreas(
          data.map((area) => ({
            id: area.id,
            title: area.title,
            slug: area.slug,
            accentColor:
              normalizeHexColor(area.accentColor) ??
              area.accentColor ??
              "#ffffff",
            scheduleType: area.scheduleType ?? "indoor",
            isActive: area.isActive,
          })),
        );
      })
      .catch(() => setError("Hizmet alanları yüklenemedi"));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let areaId = preselectedServiceAreaId ?? "";
        let copiedPackage: PackageFormEntry | null = null;
        let focusPackageKey: string | undefined;

        if (packageId || copyFromId) {
          const sourceId = packageId ?? copyFromId;
          const response = await fetch(`/api/admin/packages/${sourceId}`);
          const data = await response.json();
          if (data.error) {
            if (!cancelled) setError(data.error);
            return;
          }
          areaId = data.serviceAreaId as string;

          if (copyFromId && !packageId) {
            const copied = applyPackageCopyTransform({
              serviceAreaId: areaId,
              title: data.title,
              slug: data.slug,
              accentColor: data.accentColor ?? null,
              iconKey: data.iconKey ?? null,
              sortOrder: data.sortOrder,
              tags: data.tags ?? [],
              shootTypes: (data.shootTypes ?? []).map(
                (shootType: ApiShootType) => ({
                  label: shootType.label,
                  cashPrice: shootType.cashPrice,
                  installmentPrice: shootType.installmentPrice,
                  iconKey: shootType.iconKey,
                  sortOrder: shootType.sortOrder,
                  tags: shootType.tags ?? [],
                  content: (shootType.content ?? {}) as ShootTypeContent,
                }),
              ),
            });
            copiedPackage = {
              key: nextPackageKey(),
              title: copied.title,
              slug: copied.slug,
              accentColor:
                normalizeHexColor(copied.accentColor ?? "") ??
                copied.accentColor ??
                "#ffffff",
              iconKey: copied.iconKey ?? "",
              sortOrder: copied.sortOrder,
              isActive: copied.isActive,
              tags: copied.tags,
              shootTypes: copied.shootTypes.map((shootType) => ({
                key: nextShootTypeKey(),
                label: shootType.label,
                cashPrice: shootType.cashPrice,
                installmentPrice: shootType.installmentPrice,
                iconKey: shootType.iconKey ?? "",
                tags: shootType.tags,
                content: shootType.content,
              })),
            };
            focusPackageKey = copiedPackage.key;
          } else {
            focusPackageKey = packageId;
          }
        }

        if (!areaId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const areaResponse = await fetch(
          `/api/admin/service-areas/${areaId}/packages`,
        );
        const areaData = await areaResponse.json();
        if (areaData.error) {
          if (!cancelled) setError(areaData.error);
          return;
        }

        const areaAccent =
          normalizeHexColor(areaData.accentColor) ??
          areaData.accentColor ??
          "#ffffff";
        const loaded = ((areaData.packages ?? []) as ApiPackage[]).map((pkg) =>
          mapApiPackage(pkg, areaAccent),
        );
        const nextPackages = copiedPackage
          ? [
              ...loaded,
              {
                ...copiedPackage,
                accentColor: copiedPackage.accentColor || areaAccent,
              },
            ]
          : loaded.length > 0
            ? loaded
            : [emptyPackage(areaAccent)];

        if (cancelled) return;
        setServiceAreaId(areaId);
        setPackages(nextPackages);
        setExpandedPackages(
          focusPackageKey ? { [focusPackageKey]: true } : {},
        );
        setExpandedShootTypes({});
      } catch {
        if (!cancelled) setError("Paketler yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [packageId, copyFromId, preselectedServiceAreaId]);

  const selectedServiceArea = serviceAreas.find(
    (area) => area.id === serviceAreaId,
  );
  const scheduleType: ScheduleType =
    selectedServiceArea?.scheduleType ?? "indoor";

  async function handleServiceAreaChange(nextAreaId: string) {
    setServiceAreaId(nextAreaId);
    setError("");
    if (!nextAreaId) {
      setPackages([emptyPackage()]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/service-areas/${nextAreaId}/packages`,
      );
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const areaAccent =
        normalizeHexColor(data.accentColor) ?? data.accentColor ?? "#ffffff";
      const loaded = ((data.packages ?? []) as ApiPackage[]).map((pkg) =>
        mapApiPackage(pkg, areaAccent),
      );
      setPackages(loaded.length > 0 ? loaded : [emptyPackage(areaAccent)]);
      setExpandedPackages({});
      setExpandedShootTypes({});
    } catch {
      setError("Paketler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  function togglePackage(key: string) {
    setExpandedPackages((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleShootType(key: string) {
    setExpandedShootTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updatePackage(key: string, patch: Partial<PackageFormEntry>) {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.key === key ? { ...pkg, ...patch } : pkg)),
    );
  }

  function updateShootType(
    packageKey: string,
    shootTypeKey: string,
    patch: Partial<ShootTypeForm>,
  ) {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.key === packageKey
          ? {
              ...pkg,
              shootTypes: pkg.shootTypes.map((shootType) =>
                shootType.key === shootTypeKey
                  ? { ...shootType, ...patch }
                  : shootType,
              ),
            }
          : pkg,
      ),
    );
  }

  function updateContent(
    packageKey: string,
    shootTypeKey: string,
    patch: Partial<ShootTypeContent>,
  ) {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.key === packageKey
          ? {
              ...pkg,
              shootTypes: pkg.shootTypes.map((shootType) =>
                shootType.key === shootTypeKey
                  ? { ...shootType, content: { ...shootType.content, ...patch } }
                  : shootType,
              ),
            }
          : pkg,
      ),
    );
  }

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

  function findShootType(compositeKey: string) {
    const [packageKey, shootTypeKey] = compositeKey.split("::");
    const pkg = packages.find((entry) => entry.key === packageKey);
    const shootType = pkg?.shootTypes.find(
      (entry) => entry.key === shootTypeKey,
    );
    return { packageKey, shootTypeKey, pkg, shootType };
  }

  function appendGalleryMedia(
    compositeKey: string,
    items: Pick<PackageGalleryMedia, "url" | "type">[],
  ) {
    if (items.length === 0) return;
    const { packageKey, shootTypeKey, pkg, shootType } =
      findShootType(compositeKey);
    if (!pkg || !shootType) return;

    const current = shootType.content.galleryMedia ?? [];
    const existingUrls = new Set(current.map((item) => item.url));
    const nextItems = items
      .filter((item) => !existingUrls.has(item.url))
      .map((item) => ({
        url: item.url,
        alt: shootType.label || pkg.title,
        type: item.type ?? "image",
      }));

    if (nextItems.length === 0) return;
    updateContent(packageKey, shootTypeKey, {
      galleryMedia: [...current, ...nextItems],
    });
  }

  async function handleMediaUpload(
    compositeKey: string,
    file: File,
    mediaType: "image" | "video",
  ) {
    const url = await uploadFile(file);
    if (!url) return;
    appendGalleryMedia(compositeKey, [{ url, type: mediaType }]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!serviceAreaId) {
      setError("Önce bir hizmet alanı seçin.");
      setSaving(false);
      return;
    }

    if (packages.length === 0) {
      setError("En az bir paket ekleyin.");
      setSaving(false);
      return;
    }

    const emptyTitle = packages.find((pkg) => !pkg.title.trim());
    if (emptyTitle) {
      setError("Tüm paketlere bir başlık girin (ör. Sade Prime).");
      setSaving(false);
      return;
    }

    const emptyShootType = packages
      .flatMap((pkg) =>
        pkg.shootTypes.map((shootType) => ({ pkg, shootType })),
      )
      .find(({ shootType }) => !shootType.label.trim());
    if (emptyShootType) {
      setError(
        `"${emptyShootType.pkg.title.trim()}" paketindeki tüm çekim türlerine bir ad girin.`,
      );
      setSaving(false);
      return;
    }

    const invalidPrice = packages
      .flatMap((pkg) =>
        pkg.shootTypes.map((shootType) => ({ pkg, shootType })),
      )
      .find(
        ({ shootType }) =>
          !Number.isInteger(shootType.cashPrice) ||
          shootType.cashPrice <= 0 ||
          !Number.isInteger(shootType.installmentPrice) ||
          shootType.installmentPrice <= 0,
      );
    if (invalidPrice) {
      setError(
        `"${invalidPrice.pkg.title.trim()} › ${invalidPrice.shootType.label.trim()}" çekim türünde hemen ödeme ve parçalı ödeme tutarları 0'dan büyük tam sayı olmalıdır.`,
      );
      setSaving(false);
      return;
    }

    const invalidAccent = packages.find(
      (pkg) => !normalizeHexColor(pkg.accentColor),
    );
    if (invalidAccent) {
      setError(
        `"${invalidAccent.title.trim() || "Paket"}" için geçerli bir accent renk girin (örn. #ff9a5e).`,
      );
      setSaving(false);
      return;
    }

    const payload = {
      packages: packages.map((pkg, index) => ({
        ...(pkg.id ? { id: pkg.id } : {}),
        title: pkg.title.trim(),
        ...(pkg.slug.trim() ? { slug: pkg.slug.trim() } : {}),
        accentColor: normalizeHexColor(pkg.accentColor),
        iconKey: pkg.iconKey || null,
        sortOrder: pkg.sortOrder || index,
        isActive: pkg.isActive,
        tags: pkg.tags,
        shootTypes: serializeShootTypes(pkg.shootTypes),
      })),
    };

    const response = await fetch(
      `/api/admin/service-areas/${serviceAreaId}/packages`,
      {
        method: "PUT",
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
    blobPickerKey !== null
      ? findShootType(blobPickerKey).shootType?.content.galleryMedia ?? []
      : [];

  const pageTitle = selectedServiceArea
    ? `${selectedServiceArea.title} paketleri`
    : copyFromId
      ? "Paket Kopyala"
      : "Paketler";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mx-auto min-w-0 max-w-3xl space-y-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Hizmet alanı seçin, ardından o alanın altına Sade Prime, Süper
              Prime gibi paketler ekleyin. Her paketin kendi çekim türleri
              vardır.
            </p>
          </div>
          <Link
            href="/admin/paketler"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Geri
          </Link>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
          <Field label="Hizmet Alanı">
            <select
              value={serviceAreaId}
              onChange={(e) => handleServiceAreaChange(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Hizmet alanı seçin</option>
              {serviceAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.title}
                  {area.isActive ? "" : " (pasif)"}
                </option>
              ))}
            </select>
          </Field>
          {serviceAreas.length === 0 ? (
            <p className="text-xs text-amber-400">
              Henüz hizmet alanı yok.{" "}
              <Link
                href="/admin/hizmet-alanlari/yeni"
                className="underline hover:text-amber-300"
              >
                Önce bir hizmet alanı oluşturun.
              </Link>
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Örnek: Dış Çekim hizmet alanı → Sade Prime ve Süper Prime
              paketleri → her pakette Fotoğraf / Fotoğraf + Video.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-white">Paketler</h2>
            <button
              type="button"
              onClick={() => {
                const next = emptyPackage(
                  selectedServiceArea?.accentColor ?? "#ffffff",
                );
                setPackages((prev) => [...prev, next]);
                setExpandedPackages((prev) => ({ ...prev, [next.key]: true }));
              }}
              disabled={!serviceAreaId}
              className="shrink-0 text-sm text-zinc-400 hover:text-white disabled:opacity-40"
            >
              + Paket Ekle
            </button>
          </div>

          {packages.map((pkg, packageIndex) => {
            const packageExpanded = expandedPackages[pkg.key] ?? packageIndex === 0;
            const packageLabel =
              pkg.title.trim() || `Paket ${packageIndex + 1}`;

            return (
              <div
                key={pkg.key}
                className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5"
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => togglePackage(pkg.key)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    aria-expanded={packageExpanded}
                  >
                    <ChevronDown
                      className={`mt-0.5 h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                        packageExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-white">
                        {packageLabel}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {pkg.shootTypes.length} çekim türü
                        {pkg.isActive ? "" : " · pasif"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (packages.length <= 1) return;
                      setPackages((prev) =>
                        prev.filter((entry) => entry.key !== pkg.key),
                      );
                    }}
                    disabled={packages.length <= 1}
                    className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Paketi Kaldır
                  </button>
                </div>

                {packageExpanded ? (
                  <>
        <div className="grid-safe grid gap-4 md:grid-cols-2">
          <Field label="Paket Başlığı">
            <input
              value={pkg.title}
              onChange={(e) => updatePackage(pkg.key, { title: e.target.value })}
              required
              placeholder="örn. Sade Prime"
              className={inputClass}
            />
          </Field>
          <Field label="Bağlantı adı (slug)">
            <input
              value={pkg.slug}
              onChange={(e) => updatePackage(pkg.key, { slug: e.target.value })}
              placeholder="Boş bırakılırsa başlıktan üretilir"
              className={inputClass}
            />
          </Field>
          <Field label="Accent Renk">
            <HexColorInput
              value={pkg.accentColor}
              onChange={(value) =>
                updatePackage(pkg.key, { accentColor: value })
              }
            />
          </Field>
          <Field label="Paket İkonu (SVG)">
            <p className="mb-2 text-xs leading-relaxed text-zinc-500">
              Kare oranlı, tek renkli veya siyah SVG yükleyin. İkon rengi
              accent renginden gelir; SVG içine sabit renk kodu yazmayın.
            </p>
            {pkg.iconKey ? (
              <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                <PackageIconDisplay
                  iconKey={pkg.iconKey}
                  className="h-6 w-6 shrink-0"
                  style={{ color: pkg.accentColor }}
                  imageSizes="24px"
                />
                <span className="min-w-0 flex-1 break-all text-xs text-zinc-400">
                  {isCustomPackageIcon(pkg.iconKey)
                    ? pkg.iconKey
                    : `Sistem ikonu: ${pkg.iconKey}`}
                </span>
                <button
                  type="button"
                  onClick={() => updatePackage(pkg.key, { iconKey: "" })}
                  className="shrink-0 text-xs text-zinc-500 hover:text-white"
                >
                  Kaldır
                </button>
              </div>
            ) : (
              <p className="mb-3 text-xs text-zinc-500">
                İkon yoksa hizmet alanının ikonu kullanılır.
              </p>
            )}
            <AdminFileUpload
              accept=".svg,image/svg+xml"
              label="SVG İkon Yükle"
              fileLabel={pkg.iconKey ? "İkonu Değiştir" : undefined}
              hint="Yalnızca .svg dosyaları kabul edilir."
              onFileSelect={async (file) => {
                const isSvg =
                  file.type === "image/svg+xml" ||
                  file.name.toLowerCase().endsWith(".svg");
                if (!isSvg) {
                  setError("Paket ikonu yalnızca SVG formatında olabilir");
                  return;
                }
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                });
                if (!response.ok) {
                  setError("Dosya yüklenemedi");
                  return;
                }
                const data = await response.json();
                updatePackage(pkg.key, { iconKey: data.url as string });
              }}
            />
          </Field>
          <Field label="Sıra">
            <input
              type="number"
              value={pkg.sortOrder}
              onChange={(e) =>
                updatePackage(pkg.key, { sortOrder: Number(e.target.value) })
              }
              className={inputClass}
            />
          </Field>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={pkg.isActive}
                onChange={(e) =>
                  updatePackage(pkg.key, { isActive: e.target.checked })
                }
              />
              Aktif (sitede göster)
            </label>
          </div>
          <div className="md:col-span-2">
            <ReorderableTagsEditor
              title="Paket Etiketleri"
              tags={pkg.tags}
              onChange={(nextTags) =>
                updatePackage(pkg.key, { tags: nextTags })
              }
              maxTags={MAX_HIERARCHY_TAGS}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">Çekim Türleri</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Bu pakete ait fiyat, galeri ve İncele içeriği. Her çekim türü
                birbirinden bağımsızdır.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updatePackage(pkg.key, {
                  shootTypes: [...pkg.shootTypes, emptyShootType()],
                })
              }
              className="shrink-0 text-sm text-zinc-400 hover:text-white"
            >
              + Çekim Türü Ekle
            </button>
          </div>

          {pkg.shootTypes.map((shootType, index) => {
            const key = shootType.key;
            const compositeKey = `${pkg.key}::${key}`;
            const displayLabel =
              shootType.label.trim() || `Çekim Türü ${index + 1}`;
            const gallery = shootType.content.galleryMedia ?? [];
            const sections = [
              ...(shootType.content.detailSections ?? []),
            ].sort((a, b) => a.sortOrder - b.sortOrder);
            const stageDefinitions = resolveWorkflowStages(
              shootType,
              scheduleType,
            );
            const stageTags = shootType.content.workflowStageTags ?? {};
            const isExpanded = expandedShootTypes[compositeKey] ?? false;

            function setSections(next: PackageDetailSection[]) {
              updateContent(pkg.key, key, { detailSections: next });
            }

            function setGallery(next: PackageGalleryMedia[]) {
              updateContent(pkg.key, key, { galleryMedia: next });
            }

            return (
              <div
                key={key}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <div className="flex items-start gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => toggleShootType(compositeKey)}
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
                        {displayLabel}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {gallery.length} galeri medyası · Hemen ödeme{" "}
                        {shootType.cashPrice.toLocaleString("tr-TR")} ₺
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pkg.shootTypes.length <= 1) return;
                      updatePackage(pkg.key, {
                        shootTypes: pkg.shootTypes.filter(
                          (entry) => entry.key !== key,
                        ),
                      });
                    }}
                    disabled={pkg.shootTypes.length <= 1}
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
                          value={shootType.label}
                          onChange={(e) =>
                            updateShootType(pkg.key, key, { label: e.target.value })
                          }
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
                                shootType.iconKey ||
                                inferOptionIconKey(shootType.label)
                              }
                              className="h-5 w-5 text-white"
                            />
                          </span>
                          <select
                            value={shootType.iconKey}
                            onChange={(e) =>
                              updateShootType(pkg.key, key, { iconKey: e.target.value })
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
                          value={shootType.cashPrice}
                          onChange={(e) =>
                            updateShootType(pkg.key, key, {
                              cashPrice: Number(e.target.value),
                            })
                          }
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
                          value={shootType.installmentPrice}
                          onChange={(e) =>
                            updateShootType(pkg.key, key, {
                              installmentPrice: Number(e.target.value),
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <ReorderableTagsEditor
                      title="Çekim Türü Etiketleri"
                      tags={shootType.tags}
                      onChange={(nextTags) =>
                        updateShootType(pkg.key, key, { tags: nextTags })
                      }
                      maxTags={MAX_HIERARCHY_TAGS}
                    />

                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <PackageWorkflowStagesEditor
                        stages={stageDefinitions}
                        scheduleType={scheduleType}
                        onChange={(stages) =>
                          updateContent(pkg.key, key, { workflowStages: stages })
                        }
                      />
                    </div>

                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <div>
                        <h4 className="text-sm font-medium text-white">
                          Süreç Etiketleri
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500">
                          Müşteri takip sayfasındaki sipariş durumu
                          timeline&apos;ında her aşamada gösterilecek etiketler.
                          İnceleme metinlerinden bağımsızdır.
                        </p>
                      </div>
                      {stageDefinitions.map((stageDef) => (
                        <PostShootTagsEditor
                          key={stageDef.id}
                          title={stageDef.label}
                          tags={resolveStageTagsForDefinition(
                            stageTags,
                            stageDef.id,
                            stageDef.builtinKey,
                          )}
                          onChange={(nextTags) =>
                            updateContent(pkg.key, key, {
                              workflowStageTags: {
                                ...stageTags,
                                [stageDef.id]: nextTags,
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
                          Tüm medya dosyaları 1:1 kare oranında olmalıdır. Sıra,
                          kaydırma sırasını belirler.
                        </p>
                      </div>
                      {gallery.map((media, mediaIndex) => {
                        const previewUrl =
                          packageMediaUrl(media.url) ?? media.url;
                        const isVideo = media.type === "video";
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
                                    const next = [...gallery];
                                    next[mediaIndex] = {
                                      ...next[mediaIndex],
                                      alt: e.target.value,
                                    };
                                    setGallery(next);
                                  }}
                                  placeholder="Alt metin (opsiyonel)"
                                  className={inputClass}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={mediaIndex === 0}
                                    onClick={() =>
                                      setGallery(
                                        moveGalleryMedia(
                                          gallery,
                                          mediaIndex,
                                          -1,
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
                                    disabled={mediaIndex === gallery.length - 1}
                                    onClick={() =>
                                      setGallery(
                                        moveGalleryMedia(gallery, mediaIndex, 1),
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                    Aşağı
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setGallery(
                                        gallery.filter(
                                          (_, i) => i !== mediaIndex,
                                        ),
                                      )
                                    }
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
                          onClick={() => setBlobPickerKey(compositeKey)}
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
                              handleMediaUpload(compositeKey, file, "image")
                            }
                          />
                          <AdminFileUpload
                            accept="video/mp4,video/webm"
                            label="Yeni Video Yükle"
                            hint="1:1 kare oran zorunludur. MP4 veya WebM formatında video."
                            onFileSelect={(file) =>
                              handleMediaUpload(compositeKey, file, "video")
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
                              checked={shootType.content.inspectEnabled ?? true}
                              onChange={(e) =>
                                updateContent(pkg.key, key, {
                                  inspectEnabled: e.target.checked,
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
                            onClick={() =>
                              setSections(
                                mergeDefaultPostShootSections(
                                  sections,
                                  scheduleType,
                                ),
                              )
                            }
                            className="text-sm text-zinc-400 hover:text-white"
                          >
                            Çekim sonrası bölümlerini ekle
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSections([
                                ...sections,
                                {
                                  id: crypto.randomUUID(),
                                  title: "",
                                  body: "",
                                  tags: [],
                                  sortOrder: sections.length,
                                },
                              ])
                            }
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

                      {sections.map((section) => (
                        <div
                          key={section.id}
                          className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-4"
                        >
                          <input
                            value={section.title}
                            onChange={(e) =>
                              setSections(
                                sections.map((entry) =>
                                  entry.id === section.id
                                    ? { ...entry, title: e.target.value }
                                    : entry,
                                ),
                              )
                            }
                            placeholder="Başlık"
                            className={inputClass}
                          />
                          <ReorderableTagsEditor
                            title="Etiketler"
                            tags={section.tags ?? []}
                            onChange={(nextTags) =>
                              setSections(
                                sections.map((entry) =>
                                  entry.id === section.id
                                    ? { ...entry, tags: nextTags }
                                    : entry,
                                ),
                              )
                            }
                          />
                          <textarea
                            value={section.body}
                            onChange={(e) =>
                              setSections(
                                sections.map((entry) =>
                                  entry.id === section.id
                                    ? { ...entry, body: e.target.value }
                                    : entry,
                                ),
                              )
                            }
                            rows={4}
                            placeholder="Açıklama metni"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSections(
                                sections.filter(
                                  (entry) => entry.id !== section.id,
                                ),
                              )
                            }
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
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={saving || !serviceAreaId}
          className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <BlobMediaPickerModal
        open={blobPickerKey !== null}
        onClose={() => setBlobPickerKey(null)}
        onSelect={(items) => {
          if (blobPickerKey) appendGalleryMedia(blobPickerKey, items);
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
