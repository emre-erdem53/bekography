"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReorderableTagsEditor } from "@/components/admin/reorderable-tags-editor";
import { HexColorInput } from "@/components/admin/hex-color-input";
import { AdminFileUpload } from "@/components/admin/admin-file-upload";
import {
  isCustomPackageIcon,
  PackageIconDisplay,
} from "@/components/packages/package-icon";
import { normalizeHexColor } from "@/lib/color-utils";
import {
  defaultRequestFieldLabels,
  type PackageServiceItem,
  type ServiceAreaContent,
} from "@/lib/package-seed-data";
import type { ScheduleType } from "@/lib/package-types";
import { MAX_HIERARCHY_TAGS } from "@/lib/validations";
import { PACKAGE_SERVICE_ICON_KEYS } from "@/lib/package-option-icon";

const emptyContent: ServiceAreaContent = { services: [] };

export function ServiceAreaForm({ serviceAreaId }: { serviceAreaId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [accentColor, setAccentColor] = useState("#ffffff");
  const [iconKey, setIconKey] = useState("Package");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("indoor");
  const [isCompanionOnly, setIsCompanionOnly] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState<ServiceAreaContent>(emptyContent);
  const [loading, setLoading] = useState(!!serviceAreaId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceAreaId) return;

    fetch(`/api/admin/service-areas/${serviceAreaId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setTitle(data.title);
        setSlug(data.slug);
        setAccentColor(normalizeHexColor(data.accentColor) ?? data.accentColor);
        setIconKey(data.iconKey);
        setSortOrder(data.sortOrder);
        setIsActive(data.isActive);
        setScheduleType(data.scheduleType ?? "indoor");
        setIsCompanionOnly(Boolean(data.isCompanionOnly));
        setTags(Array.isArray(data.tags) ? data.tags : []);
        const loaded = (data.content ?? {}) as ServiceAreaContent;
        setContent({
          services: loaded.services ?? [],
          subtitle: loaded.subtitle ?? "",
          requestFieldLabels: loaded.requestFieldLabels,
        });
      })
      .finally(() => setLoading(false));
  }, [serviceAreaId]);

  const requestFieldLabels =
    content.requestFieldLabels ??
    defaultRequestFieldLabels(title || "Çekim", scheduleType);

  async function handleIconUpload(file: File) {
    const lowerName = file.name.toLowerCase();
    const isSvg =
      file.type === "image/svg+xml" || lowerName.endsWith(".svg");
    const isRaster =
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/webp" ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp");

    if (!isSvg && !isRaster) {
      setError("Vitrin görseli SVG, PNG, JPG veya WebP formatında olmalı");
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
    setIconKey(data.url as string);
  }

  const usesRasterIcon =
    isCustomPackageIcon(iconKey) && !iconKey.toLowerCase().endsWith(".svg");

  function updateService(index: number, patch: Partial<PackageServiceItem>) {
    const next = [...content.services];
    next[index] = { ...next[index], ...patch };
    setContent({ ...content, services: next });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim()) {
      setError("Hizmet alanı başlığı girin.");
      setSaving(false);
      return;
    }

    if (!iconKey.trim()) {
      setError("Hizmet alanı ikonu seçin veya yükleyin.");
      setSaving(false);
      return;
    }

    const normalizedAccent = normalizeHexColor(accentColor);
    if (!normalizedAccent) {
      setError("Accent renk geçerli bir hex kodu olmalı (örn. #ff9a5e)");
      setSaving(false);
      return;
    }

    const emptyService = content.services.find(
      (service) => !service.title.trim() || !service.iconKey.trim(),
    );
    if (emptyService) {
      setError("Tüm hizmet kartlarına başlık ve ikon girin.");
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      accentColor: normalizedAccent,
      iconKey,
      highlight: false,
      backgroundImageUrl: null,
      heroImageUrl: null,
      sortOrder,
      isActive,
      scheduleType,
      isCompanionOnly,
      tags,
      content: {
        services: content.services.map((service) => ({
          title: service.title.trim(),
          subLines: service.subLines.filter((line) => line.trim()),
          iconKey: service.iconKey,
        })),
        subtitle: (content.subtitle ?? "").trim(),
        requestFieldLabels,
      },
    };

    const response = await fetch(
      serviceAreaId
        ? `/api/admin/service-areas/${serviceAreaId}`
        : "/api/admin/service-areas",
      {
        method: serviceAreaId ? "PATCH" : "POST",
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

    router.push("/admin/hizmet-alanlari");
    router.refresh();
  }

  if (loading) {
    return <p className="text-zinc-400">Yükleniyor...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto min-w-0 max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {serviceAreaId ? "Hizmet Alanı Düzenle" : "Yeni Hizmet Alanı"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Hizmet alanı, paketlerin ve çekim türlerinin en üst seviyesidir.
          </p>
        </div>
        <Link
          href="/admin/hizmet-alanlari"
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
            placeholder="örn. Dış Çekim"
            className={inputClass}
          />
        </Field>
        <Field label="Bağlantı adı (slug)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Boş bırakılırsa başlıktan üretilir"
            className={inputClass}
          />
          <span className="text-xs text-zinc-500">
            Vitrindeki adres: /paketler/{slug.trim() || "..."}
          </span>
        </Field>
        <div className="md:col-span-2">
          <Field label="Kısa açıklama (vitrin)">
            <input
              value={content.subtitle ?? ""}
              onChange={(e) =>
                setContent({ ...content, subtitle: e.target.value })
              }
              placeholder="örn. Doğa ve şehirde sinematik dış çekim paketleri"
              maxLength={200}
              className={inputClass}
            />
            <span className="text-xs text-zinc-500">
              Paketler listesinde başlığın altında italic olarak görünür.
            </span>
          </Field>
        </div>
        <Field label="Accent Renk">
          <HexColorInput value={accentColor} onChange={setAccentColor} />
        </Field>
        <Field label="Sıra">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Vitrin görseli">
          <p className="mb-2 text-xs leading-relaxed text-zinc-500">
            Paketler listesinde başlığın solunda görünür. Kare (1:1) fotoğraf
            (PNG/JPG) veya tek renkli SVG ikon yükleyebilirsiniz. SVG ikonlar
            accent rengiyle boyanır; fotoğraflar olduğu gibi gösterilir.
          </p>
          {isCustomPackageIcon(iconKey) ? (
            <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
              <span
                className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                  usesRasterIcon ? "h-14 w-14" : "h-10 w-10"
                }`}
                style={
                  usesRasterIcon
                    ? undefined
                    : { backgroundColor: `${accentColor}22` }
                }
              >
                <PackageIconDisplay
                  iconKey={iconKey}
                  className={
                    usesRasterIcon
                      ? "h-full w-full object-cover"
                      : "h-6 w-6"
                  }
                  style={{ color: accentColor }}
                  imageSizes={usesRasterIcon ? "56px" : "24px"}
                />
              </span>
              <span className="min-w-0 flex-1 break-all text-xs text-zinc-400">
                {iconKey}
              </span>
            </div>
          ) : (
            <p className="mb-3 text-xs text-zinc-500">
              Mevcut sistem ikonu:{" "}
              <span className="text-zinc-300">{iconKey}</span>
            </p>
          )}
          <AdminFileUpload
            accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            label="Vitrin Görseli Yükle"
            fileLabel={isCustomPackageIcon(iconKey) ? "Görseli Değiştir" : undefined}
            hint="SVG, PNG, JPG veya WebP. Kare oran önerilir."
            onFileSelect={handleIconUpload}
          />
        </Field>
        <Field label="Çekim ortamı">
          <select
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
            className={inputClass}
          >
            <option value="indoor">Mekân içi (indoor)</option>
            <option value="outdoor">Dış çekim (outdoor)</option>
          </select>
          <span className="text-xs text-zinc-500">
            Dış çekim seçilirse süreç aşamalarında baskı adımı ve dış çekim
            varsayılanları kullanılır.
          </span>
        </Field>
        <div className="flex flex-col gap-3 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Aktif (sitede göster)
          </label>
          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isCompanionOnly}
              onChange={(e) => setIsCompanionOnly(e.target.checked)}
              className="mt-1"
            />
            <span>
              Tek başına satılmaz
              <span className="mt-0.5 block text-xs text-zinc-500">
                Sepette yalnızca bu hizmet alanından kalem varsa müşteriden ek
                bir paket seçmesi istenir.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <ReorderableTagsEditor
          title="Hizmet Alanı Etiketleri"
          tags={tags}
          onChange={setTags}
          maxTags={MAX_HIERARCHY_TAGS}
        />

        <div className="grid-safe grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2">
          <Field label="Talep formu tarih etiketi">
            <input
              value={requestFieldLabels.dateLabel}
              onChange={(e) =>
                setContent({
                  ...content,
                  requestFieldLabels: {
                    ...requestFieldLabels,
                    dateLabel: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Talep formu şehir etiketi">
            <input
              value={requestFieldLabels.cityLabel}
              onChange={(e) =>
                setContent({
                  ...content,
                  requestFieldLabels: {
                    ...requestFieldLabels,
                    cityLabel: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">Hizmet Kartları</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Hizmet alanı sayfasında gösterilen &ldquo;neler dahil&rdquo;
              kartları.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setContent({
                ...content,
                services: [
                  ...content.services,
                  { title: "", subLines: ["", ""], iconKey: "Camera" },
                ],
              })
            }
            className="shrink-0 text-sm text-zinc-400 hover:text-white"
          >
            + Hizmet Ekle
          </button>
        </div>

        {content.services.length === 0 ? (
          <p className="text-xs text-zinc-500">Henüz hizmet kartı yok.</p>
        ) : null}

        {content.services.map((service, index) => (
          <div
            key={`service-${index}`}
            className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="grid-safe grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Başlık
                </label>
                <input
                  value={service.title}
                  onChange={(e) => updateService(index, { title: e.target.value })}
                  placeholder="örn. Fotoğraf Çekimi"
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
                      iconKey={service.iconKey}
                      className="h-5 w-5 text-white"
                    />
                  </span>
                  <select
                    value={service.iconKey}
                    onChange={(e) =>
                      updateService(index, { iconKey: e.target.value })
                    }
                    className={`${inputClass} min-w-0 flex-1`}
                  >
                    {PACKAGE_SERVICE_ICON_KEYS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid-safe grid gap-3 md:grid-cols-2">
              {[0, 1].map((lineIndex) => (
                <div key={lineIndex}>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Alt satır {lineIndex + 1}
                  </label>
                  <input
                    value={service.subLines[lineIndex] ?? ""}
                    onChange={(e) => {
                      const subLines = [...service.subLines];
                      subLines[lineIndex] = e.target.value;
                      updateService(index, { subLines });
                    }}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setContent({
                  ...content,
                  services: content.services.filter((_, i) => i !== index),
                })
              }
              className="text-sm text-red-400 hover:text-red-300"
            >
              Hizmeti Sil
            </button>
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
