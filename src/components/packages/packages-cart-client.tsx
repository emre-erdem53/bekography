"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { PackageCategoryData } from "@/lib/package-types";
import { useCartStore } from "@/stores/cart-store";
import { getOptionGalleryPreviewUrl } from "@/lib/package-media";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PackageDetailSheet } from "@/components/packages/package-detail-sheet";

const contentWidth =
  "mx-auto w-full max-w-2xl px-4 sm:max-w-3xl sm:px-6 lg:max-w-4xl xl:max-w-5xl";

type PackagesCartClientProps = {
  categories: PackageCategoryData[];
};

export function PackagesCartClient({ categories }: PackagesCartClientProps) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const toggleSelected = useCartStore((state) => state.toggleSelected);
  const selectAll = useCartStore((state) => state.selectAll);
  const clearCart = useCartStore((state) => state.clearCart);
  const [detailCategory, setDetailCategory] =
    useState<PackageCategoryData | null>(null);
  const [detailOptionId, setDetailOptionId] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const allSelected = items.length > 0 && items.every((item) => item.selected);

  function openItemDetail(categoryId: string, packageOptionId: string) {
    const category = categoryMap.get(categoryId);
    if (!category) return;
    setDetailCategory(category);
    setDetailOptionId(packageOptionId);
  }

  function getItemPreviewUrl(
    categoryId: string,
    packageOptionId: string,
    optionLabel: string,
    storedUrl: string | null,
  ) {
    if (storedUrl) return storedUrl;
    const category = categoryMap.get(categoryId);
    if (!category) return null;
    return getOptionGalleryPreviewUrl(category, packageOptionId, optionLabel);
  }

  return (
    <main className="flex-1 bg-black pt-24 pb-10 text-white">
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
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={() => selectAll(!allSelected)}
                className="text-sm text-zinc-400 hover:text-white"
              >
                {allSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Tümünü Sil
              </button>
            </div>
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
              const previewUrl = getItemPreviewUrl(
                item.categoryId,
                item.packageOptionId,
                item.optionLabel,
                item.imageUrl,
              );

              return (
                <li
                  key={item.packageOptionId}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 md:p-5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openItemDetail(item.categoryId, item.packageOptionId)
                    }
                    className="flex w-full gap-3 text-left"
                  >
                    <div
                      className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-20 sm:w-14"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                          —
                        </div>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleSelected(item.packageOptionId)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#93f8b6]"
                    />
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
                      onClick={(event) => {
                        event.stopPropagation();
                        removeItem(item.packageOptionId);
                      }}
                      className="shrink-0 text-zinc-500 hover:text-white"
                      aria-label="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </button>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/5 pt-3 md:mt-4">
                    <PaymentTypePrice
                      type="pesin"
                      price={item.cashPrice}
                      variant="stacked"
                    />
                    <PaymentTypePrice
                      type="taksitli"
                      price={item.installmentPrice}
                      variant="stacked"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <PackageDetailSheet
        category={detailCategory}
        initialOptionId={detailOptionId}
        onClose={() => {
          setDetailCategory(null);
          setDetailOptionId(null);
        }}
      />
    </main>
  );
}
