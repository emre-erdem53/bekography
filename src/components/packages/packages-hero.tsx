"use client";

import { useEffect, useState } from "react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import { PackageCartBar } from "@/components/packages/package-cart-bar";
import { PackageDetailSheet } from "@/components/packages/package-detail-sheet";
import { PackagesCategoryAccordion } from "@/components/packages/packages-category-accordion";
import { useCartStore } from "@/stores/cart-store";

export function PackagesHero({
  categories,
  variant = "page",
}: {
  categories: PackageCategoryData[];
  variant?: "page" | "section";
}) {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    null,
  );
  const [detailCategory, setDetailCategory] =
    useState<PackageCategoryData | null>(null);
  const [detailOptionId, setDetailOptionId] = useState<string | null>(null);
  const [cartReady, setCartReady] = useState(false);
  const cartCount = useCartStore((state) => state.items.length);

  useEffect(() => {
    setCartReady(true);
  }, []);

  function handleToggleCategory(categoryId: string) {
    setExpandedCategoryId((current) =>
      current === categoryId ? null : categoryId,
    );
  }

  function handleSelectOption(
    category: PackageCategoryData,
    option: PackageOptionData,
  ) {
    setDetailCategory(category);
    setDetailOptionId(option.id);
  }

  function handleCloseDetail() {
    setDetailCategory(null);
    setDetailOptionId(null);
  }

  const Tag = variant === "section" ? "section" : "main";
  const cartPadding =
    cartReady && cartCount > 0 ? "pb-28" : variant === "section" ? "pb-6" : "pb-10";
  const outerClass =
    variant === "section"
      ? `scroll-mt-24 bg-black text-white ${cartPadding}`
      : `flex-1 bg-black pt-24 text-white ${cartReady && cartCount > 0 ? "pb-28" : "pb-10"}`;

  return (
    <Tag
      id={variant === "section" ? "paket-olustur" : undefined}
      className={outerClass}
    >
      <div
        className={`mx-auto w-full max-w-2xl px-4 sm:max-w-3xl sm:px-6 lg:max-w-3xl ${
          variant === "section" ? "pb-6 pt-16" : "pb-16 pt-4"
        }`}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Paketler
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl lg:text-5xl">
            Paket Oluştur
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
            Çekim paketine tıklayın, türünü seçin ve detayları inceleyin.
          </p>
        </div>

        <PackagesCategoryAccordion
          categories={categories}
          expandedCategoryId={expandedCategoryId}
          onToggleCategory={handleToggleCategory}
          onSelectOption={handleSelectOption}
        />
      </div>

      <PackageDetailSheet
        category={detailCategory}
        initialOptionId={detailOptionId}
        onClose={handleCloseDetail}
      />

      <PackageCartBar />
    </Tag>
  );
}
