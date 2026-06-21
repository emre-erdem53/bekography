"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { getCategoryGalleryUrls } from "@/lib/package-media";
import { PackageGalleryCarousel } from "@/components/packages/package-gallery-carousel";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PackageCartToggleButton } from "@/components/packages/package-cart-toggle-button";
import { PackageInspectSheet } from "@/components/packages/package-inspect-sheet";
import {
  buildCartItemFromCategory,
  type CartItemInput,
} from "@/stores/cart-store";
import { RequestModal } from "@/components/packages/request-modal";

type PackageDetailSheetProps = {
  category: PackageCategoryData | null;
  initialOptionId?: string | null;
  onClose: () => void;
};

function orderOptions(
  options: PackageOptionData[],
  selectedOptionId: string | null,
) {
  if (!selectedOptionId) return options;
  const selected = options.find((option) => option.id === selectedOptionId);
  if (!selected) return options;
  return [
    selected,
    ...options.filter((option) => option.id !== selectedOptionId),
  ];
}

function PackageOptionSection({
  category,
  option,
  galleryUrls,
  onInspect,
  onQuickRequest,
}: {
  category: PackageCategoryData;
  option: PackageOptionData;
  galleryUrls: string[];
  onInspect: () => void;
  onQuickRequest: () => void;
}) {
  const content = category.content as PackageCategoryContent;
  const tags =
    content.highlightTagsByOption?.[option.id] ??
    content.highlightTagsByOption?.[option.label] ??
    [];
  const inspectEnabled =
    content.inspectEnabledByOption?.[option.id] ??
    content.inspectEnabledByOption?.[option.label] ??
    true;

  return (
    <section className="flex h-full min-h-0 snap-start flex-col px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 sm:px-6 sm:pb-4">
      <div className="mx-auto flex h-full w-full max-w-lg min-h-0 flex-col">
        <header className="mb-2 shrink-0 sm:mb-3">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {category.title}
          </h2>
          <p className="mt-0.5 text-base text-white/90 sm:text-lg">
            {option.label}
          </p>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/80 px-2.5 py-0.5 text-[11px] text-white sm:px-3 sm:py-1 sm:text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="min-h-0 flex-1">
          <PackageGalleryCarousel images={galleryUrls} variant="scroll" />
        </div>

        <div className="mt-2 flex shrink-0 items-start gap-6 sm:mt-4 sm:gap-8">
          <PaymentTypePrice type="pesin" price={option.cashPrice} />
          <PaymentTypePrice type="taksitli" price={option.installmentPrice} />
        </div>

        <div className="mt-2 shrink-0 space-y-2 sm:mt-3">
          <button
            type="button"
            onClick={onInspect}
            disabled={!inspectEnabled}
            className="w-full rounded-2xl bg-[#222] py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:py-3.5 sm:text-sm"
          >
            İncele
          </button>
          <PackageCartToggleButton category={category} option={option} />
          <button
            type="button"
            onClick={onQuickRequest}
            className="w-full rounded-2xl border border-white/25 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/5 sm:py-3.5 sm:text-sm"
          >
            Hemen Talep Oluştur
          </button>
        </div>
      </div>
    </section>
  );
}

export function PackageDetailSheet({
  category,
  initialOptionId = null,
  onClose,
}: PackageDetailSheetProps) {
  const [inspectOptionId, setInspectOptionId] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [singleRequestItems, setSingleRequestItems] = useState<CartItemInput[]>(
    [],
  );

  const orderedOptions = useMemo(
    () =>
      category ? orderOptions(category.options, initialOptionId) : [],
    [category, initialOptionId],
  );

  const galleryUrls = category ? getCategoryGalleryUrls(category) : [];

  useEffect(() => {
    if (!category) return;
    setInspectOptionId(null);
    setRequestOpen(false);
    setSingleRequestItems([]);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [category?.id, initialOptionId]);

  return (
    <>
      <AnimatePresence>
        {category ? (
          <motion.div
            key={`${category.id}-${initialOptionId ?? "default"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-black"
          >
            <header className="shrink-0 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#111] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#1a1a1a] sm:gap-2 sm:py-2 sm:text-sm"
                aria-label="Paket listesine dön"
              >
                <ChevronLeft className="h-4 w-4" />
                Paketler
              </button>
            </header>

            <div className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth">
              {orderedOptions.map((option) => (
                <PackageOptionSection
                  key={option.id}
                  category={category}
                  option={option}
                  galleryUrls={galleryUrls}
                  onInspect={() => setInspectOptionId(option.id)}
                  onQuickRequest={() => {
                    setSingleRequestItems([
                      buildCartItemFromCategory(category, option),
                    ]);
                    setRequestOpen(true);
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {category && inspectOptionId ? (
        <PackageInspectSheet
          open={Boolean(inspectOptionId)}
          category={category}
          selectedOptionId={inspectOptionId}
          onClose={() => setInspectOptionId(null)}
          onBack={() => setInspectOptionId(null)}
        />
      ) : null}

      <RequestModal
        open={requestOpen}
        onClose={() => {
          setRequestOpen(false);
          setSingleRequestItems([]);
        }}
        itemsOverride={
          singleRequestItems.length > 0 ? singleRequestItems : undefined
        }
        clearCartOnSuccess={false}
      />
    </>
  );
}
