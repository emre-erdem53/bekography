"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type ShootTypeRow = {
  id: string;
  label: string;
  cashPrice: number;
  installmentPrice: number;
  isActive: boolean;
};

type PackageRow = {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  tags: string[];
  shootTypes: ShootTypeRow[];
};

type ServiceAreaGroup = {
  id: string;
  title: string;
  slug: string;
  accentColor: string;
  isActive: boolean;
  packages: PackageRow[];
};

export function PackagesAdminClient() {
  const [serviceAreas, setServiceAreas] = useState<ServiceAreaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { labels: paymentLabels } = usePaymentTypeCopy();

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then((data) => setServiceAreas(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(pkg: PackageRow) {
    const confirmed = window.confirm(
      `"${pkg.title}" paketini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
    );
    if (!confirmed) return;

    setDeletingId(pkg.id);
    const response = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "DELETE",
    });
    setDeletingId(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      window.alert(data.error ?? "Paket silinemedi");
      return;
    }

    setServiceAreas((prev) =>
      prev.map((area) => ({
        ...area,
        packages: area.packages.filter((item) => item.id !== pkg.id),
      })),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Paketler
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paketler hizmet alanlarına göre gruplanır
          </p>
        </div>
        <Link
          href="/admin/paketler/yeni"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Yeni Paket
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-400">Yükleniyor...</p>
      ) : serviceAreas.length === 0 ? (
        <p className="text-zinc-400">
          Henüz hizmet alanı yok.{" "}
          <Link
            href="/admin/hizmet-alanlari/yeni"
            className="underline hover:text-white"
          >
            Önce bir hizmet alanı oluşturun.
          </Link>
        </p>
      ) : (
        <div className="space-y-8">
          {serviceAreas.map((area) => (
            <section key={area.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: area.accentColor }}
                />
                <h2 className="text-base font-semibold text-white">
                  {area.title}
                </h2>
                <span className="text-xs text-zinc-500">
                  {area.packages.length} paket
                </span>
                {!area.isActive ? (
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    Pasif hizmet alanı
                  </span>
                ) : null}
              </div>

              {area.packages.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
                  Bu hizmet alanının altında henüz paket yok.
                </p>
              ) : (
                <div className="space-y-3">
                  {area.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {pkg.title}
                          </h3>
                          {!pkg.isActive ? (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                              Pasif
                            </span>
                          ) : null}
                        </div>
                        {pkg.tags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {pkg.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pkg.shootTypes.map((shootType) => (
                            <span
                              key={shootType.id}
                              className="rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300"
                            >
                              {shootType.label}: {paymentLabels.pesin}{" "}
                              {formatPrice(shootType.cashPrice)} /{" "}
                              {paymentLabels.taksitli}{" "}
                              {formatPrice(shootType.installmentPrice)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        <Link
                          href={`/admin/paketler/yeni?copyFrom=${pkg.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
                        >
                          <Copy className="h-4 w-4" />
                          Kopyala
                        </Link>
                        <Link
                          href={`/admin/paketler/${pkg.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
                        >
                          <Pencil className="h-4 w-4" />
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(pkg)}
                          disabled={deletingId === pkg.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === pkg.id ? "Siliniyor..." : "Sil"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
