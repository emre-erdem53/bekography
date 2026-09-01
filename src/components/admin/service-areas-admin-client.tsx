"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PackageIconDisplay } from "@/components/packages/package-icon";

type ServiceAreaRow = {
  id: string;
  title: string;
  slug: string;
  accentColor: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  scheduleType: "indoor" | "outdoor";
  isCompanionOnly: boolean;
  tags: string[];
  packages: { id: string; title: string; shootTypes: { id: string }[] }[];
};

export function ServiceAreasAdminClient() {
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/service-areas")
      .then((res) => res.json())
      .then((data) => setServiceAreas(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(serviceArea: ServiceAreaRow) {
    const confirmed = window.confirm(
      `"${serviceArea.title}" hizmet alanını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
    );
    if (!confirmed) return;

    setDeletingId(serviceArea.id);
    const response = await fetch(
      `/api/admin/service-areas/${serviceArea.id}`,
      { method: "DELETE" },
    );
    setDeletingId(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      window.alert(data.error ?? "Hizmet alanı silinemedi");
      return;
    }

    setServiceAreas((prev) =>
      prev.filter((item) => item.id !== serviceArea.id),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Hizmet Alanları
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paketlerin bağlı olduğu üst seviye. Her hizmet alanının altında
            paketler, paketlerin altında çekim türleri yer alır.
          </p>
        </div>
        <Link
          href="/admin/hizmet-alanlari/yeni"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Yeni Hizmet Alanı
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : serviceAreas.length === 0 ? (
        <p className="text-zinc-400">
          Henüz hizmet alanı yok. Paket oluşturabilmek için önce bir hizmet
          alanı ekleyin.
        </p>
      ) : (
        <div className="space-y-3">
          {serviceAreas.map((serviceArea) => {
            const shootTypeCount = serviceArea.packages.reduce(
              (total, pkg) => total + pkg.shootTypes.length,
              0,
            );

            return (
              <div
                key={serviceArea.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5"
                      style={{ color: serviceArea.accentColor }}
                    >
                      <PackageIconDisplay
                        iconKey={serviceArea.iconKey}
                        className="h-4 w-4"
                        style={{ color: serviceArea.accentColor }}
                      />
                    </span>
                    <h2 className="text-lg font-semibold text-white">
                      {serviceArea.title}
                    </h2>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                      /paketler/{serviceArea.slug}
                    </span>
                    {serviceArea.scheduleType === "outdoor" ? (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                        Dış çekim
                      </span>
                    ) : null}
                    {serviceArea.isCompanionOnly ? (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                        Tek başına satılmaz
                      </span>
                    ) : null}
                    {!serviceArea.isActive ? (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        Pasif
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {serviceArea.packages.length} paket · {shootTypeCount} çekim
                    türü
                  </p>
                  {serviceArea.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {serviceArea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <Link
                    href={`/admin/hizmet-alanlari/${serviceArea.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
                  >
                    <Pencil className="h-4 w-4" />
                    Düzenle
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(serviceArea)}
                    disabled={deletingId === serviceArea.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === serviceArea.id ? "Siliniyor..." : "Sil"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
