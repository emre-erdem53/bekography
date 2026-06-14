"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { formatPrice } from "@/lib/constants";

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

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then(setPackages)
      .finally(() => setLoading(false));
  }, []);

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
                      {option.label}: {formatPrice(option.cashPrice)} /{" "}
                      {formatPrice(option.installmentPrice)}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/admin/paketler/${pkg.id}`}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5 sm:self-center"
              >
                <Pencil className="h-4 w-4" />
                Düzenle
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
