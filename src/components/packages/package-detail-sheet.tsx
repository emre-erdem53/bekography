"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { getOptionGalleryMedia } from "@/lib/package-media";
import { normalizeDetailSections } from "@/lib/package-detail-section";
import { PackageGalleryCarousel } from "@/components/packages/package-gallery-carousel";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PackageCartToggleButton } from "@/components/packages/package-cart-toggle-button";
import {
  buildCartItemFromCategory,
  type CartItemInput,
} from "@/stores/cart-store";
import {
  getCompanionRequirementMessage,
  isCompanionOnlyCategorySlug,
} from "@/lib/cart-companion-rules";
import { RequestModal } from "@/components/packages/request-modal";
import { RequestActionLabel } from "@/components/packages/request-action-label";
import { useCartBottomInset } from "@/components/packages/package-cart-bar";

type PackageDetailSheetProps = {
  category: PackageCategoryData | null;
  initialOptionId?: string | null;
  onClose: () => void;
  presentation?: "overlay" | "inline";
};

function PackageOptionDetails({
  category,
  option,
}: {
  category: PackageCategoryData;
  option: PackageOptionData;
}) {
  const content = category.content as PackageCategoryContent;
  const optionKey = option.id;
  const optionLabelKey = option.label;
  const scopedSections =
    content.detailSectionsByOption?.[optionKey] ??
    content.detailSectionsByOption?.[optionLabelKey] ??
    content.detailSections;
  const sections = normalizeDetailSections(scopedSections).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <section className="mt-8 border-t border-white/10 pt-8 sm:mt-10 sm:pt-10">
      <h3 className="text-lg font-semibold text-white sm:text-xl">Detaylar</h3>

      {sections.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Bu çekim türü için detay bilgisi yakında eklenecek.
        </p>
      ) : (
        <div className="mt-5 space-y-5 sm:mt-6">
          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                {section.title}
              </h4>
              {section.tags && section.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {section.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/80 px-2.5 py-0.5 text-[11px] text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PackageOptionDetailView({
  category,
  option,
  onQuickRequest,
  quickRequestDisabled,
}: {
  category: PackageCategoryData;
  option: PackageOptionData;
  onQuickRequest: () => void;
  quickRequestDisabled: boolean;
}) {
  const cartBottomInset = useCartBottomInset();
  const content = category.content as PackageCategoryContent;
  const galleryMedia = getOptionGalleryMedia(
    category,
    option.id,
    option.label,
  );
  const tags =
    content.highlightTagsByOption?.[option.id] ??
    content.highlightTagsByOption?.[option.label] ??
    [];

  return (
    <div
      className={`mx-auto w-full max-w-lg px-4 pt-2 sm:px-6 ${
        cartBottomInset === "pb-44"
          ? "pb-44"
          : cartBottomInset === "pb-28"
            ? "pb-28"
            : "pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-8"
      }`}
    >
      <header className="mb-4 sm:mb-5">
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

      <PackageGalleryCarousel media={galleryMedia} variant="detail" />

      <div className="mt-4 flex items-start gap-6 sm:mt-5 sm:gap-8">
        <PaymentTypePrice type="pesin" price={option.cashPrice} />
        <PaymentTypePrice type="taksitli" price={option.installmentPrice} />
      </div>

      <div className="mt-4 space-y-2 sm:mt-5">
        <PackageCartToggleButton category={category} option={option} />
        <button
          type="button"
          onClick={onQuickRequest}
          disabled={quickRequestDisabled}
          className="w-full rounded-2xl border border-white/25 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45 sm:py-3.5 sm:text-sm"
        >
          <RequestActionLabel iconVariant="brand">
            Hemen Talep Oluştur
          </RequestActionLabel>
        </button>
        {quickRequestDisabled ? (
          <p className="text-center text-[11px] leading-relaxed text-amber-200/80 sm:text-xs">
            {getCompanionRequirementMessage()}
          </p>
        ) : null}
      </div>

      <PackageOptionDetails category={category} option={option} />
    </div>
  );
}

export function PackageDetailSheet({
  category,
  initialOptionId = null,
  onClose,
  presentation = "overlay",
}: PackageDetailSheetProps) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [singleRequestItems, setSingleRequestItems] = useState<CartItemInput[]>(
    [],
  );

  const selectedOption = useMemo(() => {
    if (!category) return null;
    if (initialOptionId) {
      return (
        category.options.find((option) => option.id === initialOptionId) ??
        category.options[0] ??
        null
      );
    }
    return category.options[0] ?? null;
  }, [category, initialOptionId]);

  useEffect(() => {
    if (!category) return;
    setRequestOpen(false);
    setSingleRequestItems([]);
    if (presentation !== "overlay") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [category?.id, initialOptionId, presentation]);

  const shellClass =
    presentation === "inline"
      ? "relative w-full"
      : "fixed inset-0 z-[70] flex flex-col bg-black";

  const quickRequestDisabled = Boolean(
    category && isCompanionOnlyCategorySlug(category.slug),
  );

  const content =
    category && selectedOption ? (
      <>
        <header
          className={
            presentation === "inline"
              ? "shrink-0 px-4 pb-3 pt-1 sm:px-6"
              : "shrink-0 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6"
          }
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            aria-label="Paket listesine dön"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            Paketler
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <PackageOptionDetailView
            category={category}
            option={selectedOption}
            quickRequestDisabled={quickRequestDisabled}
            onQuickRequest={() => {
              if (quickRequestDisabled) return;
              setSingleRequestItems([
                buildCartItemFromCategory(category, selectedOption),
              ]);
              setRequestOpen(true);
            }}
          />
        </div>
      </>
    ) : null;

  return (
    <>
      {presentation === "inline" ? (
        content
      ) : (
        <LayoutGroup id="package-detail-overlay">
          <AnimatePresence>
            {category && selectedOption ? (
              <motion.div
                key={`${category.id}-${selectedOption.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={shellClass}
              >
                {content}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </LayoutGroup>
      )}

      <RequestModal
        open={requestOpen}
        onClose={() => {
          setRequestOpen(false);
          setSingleRequestItems([]);
        }}
        itemsOverride={
          singleRequestItems.length > 0 ? singleRequestItems : undefined
        }
      />
    </>
  );
}
