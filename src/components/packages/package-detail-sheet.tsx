"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { getOptionGalleryMedia } from "@/lib/package-media";
import { resolveDetailSectionsForOption } from "@/lib/package-detail-section";
import { PackageOptionDetailBody } from "@/components/packages/package-option-detail-body";
import { BekographyBrand } from "@/components/bekography-brand";
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
import { RequestActionLabel, requestActionSurfaceClassFull } from "@/components/packages/request-action-label";
import { useCartBottomInset } from "@/components/packages/package-cart-bar";

type PackageDetailSheetProps = {
  category: PackageCategoryData | null;
  initialOptionId?: string | null;
  onClose: () => void;
  presentation?: "overlay" | "inline";
};

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
  const sections = resolveDetailSectionsForOption(
    content,
    option.id,
    option.label,
  );

  return (
    <div
      className={`mx-auto w-full max-w-lg px-4 pt-2 sm:px-6 ${
        cartBottomInset ??
        "pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-8"
      }`}
    >
      <PackageOptionDetailBody
        categoryTitle={category.title}
        optionLabel={option.label}
        highlightTags={tags}
        cashPrice={option.cashPrice}
        installmentPrice={option.installmentPrice}
        detailSections={sections}
        galleryMedia={galleryMedia}
        showGallery
        actions={
          <>
            <PackageCartToggleButton category={category} option={option} />
            <button
              type="button"
              onClick={onQuickRequest}
              disabled={quickRequestDisabled}
              className={`${requestActionSurfaceClassFull} min-h-11 rounded-2xl border border-white/25 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-12 sm:py-3.5 sm:text-sm`}
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
          </>
        }
      />
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
              ? "shrink-0 border-b border-white/10 px-4 pb-3 pt-1 sm:px-6"
              : "shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/paketler"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              aria-label="Paketler sayfasına dön"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              Paketler
            </Link>
            <BekographyBrand size="sm" className="hover:opacity-100" />
          </div>
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
