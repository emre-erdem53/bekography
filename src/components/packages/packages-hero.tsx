"use client";

import { useState } from "react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import { PackageDetailSheet } from "@/components/packages/package-detail-sheet";
import { PackagesCategoryAccordion } from "@/components/packages/packages-category-accordion";

const pageMainClass = "flex-1 bg-black pt-24 pb-10 text-white";
const sectionClass = "scroll-mt-24 bg-black pb-6 text-white";

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

  const inner = (
    <>
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
    </>
  );

  if (variant === "section") {
    return (
      <section id="paket-olustur" className={sectionClass}>
        {inner}
      </section>
    );
  }

  return <main className={pageMainClass}>{inner}</main>;
}
