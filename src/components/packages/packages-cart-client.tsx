"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { packageMediaUrl } from "@/lib/package-media";
import { useCartStore } from "@/stores/cart-store";
import { PackageCartBar } from "@/components/packages/package-cart-bar";
import { RequestModal } from "@/components/packages/request-modal";

const contentWidth =
  "mx-auto w-full max-w-2xl px-4 sm:max-w-3xl sm:px-6 lg:max-w-4xl xl:max-w-5xl";

export function PackagesCartClient() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleSelected = useCartStore((state) => state.toggleSelected);
  const selectAll = useCartStore((state) => state.selectAll);
  const [requestOpen, setRequestOpen] = useState(false);

  const allSelected = items.length > 0 && items.every((item) => item.selected);

  return (
    <main
      className={`flex-1 bg-black pt-24 text-white ${items.length > 0 ? "pb-28" : "pb-10"}`}
    >
      <section className={`${contentWidth} pb-16 pt-4`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/paketler"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Paketler
            </Link>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Sepetim</h1>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => selectAll(!allSelected)}
              className="shrink-0 text-sm text-zinc-400 hover:text-white"
            >
              {allSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center">
            <p className="text-zinc-400">Sepetiniz boş.</p>
            <Link
              href="/paketler"
              className="mt-4 inline-block rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Paketlere Git
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {items.map((item) => {
              const thumb = packageMediaUrl(item.imageUrl);
              return (
                <li
                  key={item.packageOptionId}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 md:p-5"
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelected(item.packageOptionId)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#93f8b6]"
                    />
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#111] md:h-20 md:w-20">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold md:text-lg"
                        style={{ color: item.accentColor }}
                      >
                        {item.categoryTitle}
                      </p>
                      <p className="text-sm text-zinc-400">{item.optionLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.packageOptionId)}
                      className="shrink-0 text-zinc-500 hover:text-white"
                      aria-label="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/5 pt-3 text-sm md:mt-4">
                    <div>
                      <p className="text-xs text-zinc-500">Peşin</p>
                      <p className="font-semibold text-white">
                        {formatPrice(item.cashPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Parçalı</p>
                      <p className="font-semibold text-zinc-400">
                        {formatPrice(item.installmentPrice)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <PackageCartBar
        showRequestAction
        onRequestClick={() => setRequestOpen(true)}
      />

      <RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </main>
  );
}
