"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type PackageCategory = {
  id: string;
  title: string;
  slug: string;
  accentColor: string;
  isActive: boolean;
  options: { label: string; cashPrice: number; installmentPrice: number }[];
};

export function PackagesAdminClient() {
  const [packages, setPackages] = useState<PackageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { labels: paymentLabels } = usePaymentTypeCopy();

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then(setPackages)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(pkg: PackageCategory) {
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
      const data = await response.json();
      window.alert(data.error ?? "Paket silinemedi");
      return;
    }

    setPackages((prev) => prev.filter((item) => item.id !== pkg.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Paketler</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paket kategorilerini yönetin
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
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: pkg.accentColor }}
                  />
                  <h2 className="text-lg font-semibold text-white">{pkg.title}</h2>
                  {!pkg.isActive ? (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      Pasif
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pkg.options.map((option) => (
                    <span
                      key={option.label}
                      className="rounded-lg bg-white/5 px-2 py-1 text-xs text-zinc-300"
                    >
                      {option.label}: {paymentLabels.pesin}{" "}
                      {formatPrice(option.cashPrice)} /{" "}
                      {paymentLabels.taksitli}{" "}
                      {formatPrice(option.installmentPrice)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
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
    </div>
  );
}
