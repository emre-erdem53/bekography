"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { formatPrice } from "@/lib/constants";
import { getCategoryGalleryUrls } from "@/lib/package-media";
import { PackageGalleryCarousel } from "@/components/packages/package-gallery-carousel";
import { PackageInspectSheet } from "@/components/packages/package-inspect-sheet";
import {
  buildCartItemFromCategory,
  useCartStore,
  type CartItemInput,
} from "@/stores/cart-store";
import { RequestModal } from "@/components/packages/request-modal";

type PackageDetailSheetProps = {
  category: PackageCategoryData | null;
  onClose: () => void;
};

export function PackageDetailSheet({
  category,
  onClose,
}: PackageDetailSheetProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [singleRequestItems, setSingleRequestItems] = useState<CartItemInput[]>(
    [],
  );

  useEffect(() => {
    setSelectedOptionId(null);
    setInspectOpen(false);
    setRequestOpen(false);
    setSingleRequestItems([]);
  }, [category?.id]);

  useEffect(() => {
    if (!category) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [category]);

  const content = category?.content as PackageCategoryContent | undefined;
  const selectedOption =
    category?.options.find((o) => o.id === selectedOptionId) ??
    category?.options[0];
  const selectedOptionInspectEnabled = (() => {
    if (!category || !selectedOption) return false;
    const detailContent = category.content as PackageCategoryContent;
    const optionKey = selectedOption.id;
    const optionLabel = selectedOption.label;
    return (
      detailContent.inspectEnabledByOption?.[optionKey] ??
      detailContent.inspectEnabledByOption?.[optionLabel] ??
      true
    );
  })();
  const galleryUrls = category ? getCategoryGalleryUrls(category) : [];

  function getOptionTags(option: { id: string; label: string }) {
    return (
      content?.highlightTagsByOption?.[option.id] ??
      content?.highlightTagsByOption?.[option.label] ??
      []
    );
  }

  function handleAddToCart() {
    if (!category || !selectedOption) return;
    addItem(buildCartItemFromCategory(category, selectedOption));
    onClose();
  }

  function handleQuickRequest() {
    if (!category || !selectedOption) return;
    const item = buildCartItemFromCategory(category, selectedOption);
    setSingleRequestItems([item]);
    setRequestOpen(true);
  }

  return (
    <>
      <AnimatePresence>
        {category ? (
          <motion.div
            key={category.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] overflow-hidden bg-black/80"
            onClick={onClose}
          >
            <div className="flex h-full w-full items-end justify-center md:items-center md:p-6 lg:p-10">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                onClick={(e) => e.stopPropagation()}
                className="flex h-[100dvh] w-full max-h-[100dvh] flex-col overflow-hidden bg-black md:h-auto md:max-h-[min(90vh,880px)] md:max-w-xl md:rounded-3xl md:border md:border-white/10 md:shadow-2xl lg:max-w-2xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 md:px-6 md:py-4">
                  <div className="min-w-0 pr-3">
                    <h2
                      className="truncate text-xl font-semibold md:text-2xl"
                      style={{ color: category.accentColor }}
                    >
                      {category.title}
                    </h2>
                    {selectedOption ? (
                      <p className="truncate text-sm text-zinc-400">
                        {selectedOption.label}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                    aria-label="Kapat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
                  <PackageGalleryCarousel images={galleryUrls} variant="detail" />

                  <div className="mt-5 space-y-2 md:mt-6">
                    {category.options.map((option) => {
                      const active =
                        (selectedOptionId ?? category.options[0]?.id) ===
                        option.id;
                      const optionTags = getOptionTags(option);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedOptionId(option.id)}
                          className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors md:px-5 md:py-3.5 ${
                            active
                              ? "border-white/30 bg-white/10"
                              : "border-white/10 bg-[#111]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-sm font-semibold md:text-base"
                              style={{ color: category.accentColor }}
                            >
                              {option.label}
                            </span>
                            {optionTags.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {optionTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] text-zinc-300 md:text-xs"
                                  >
                                    • {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right text-xs md:text-sm">
                            <p className="font-bold text-white">
                              {formatPrice(option.cashPrice)}
                            </p>
                            <p className="text-zinc-500">
                              {formatPrice(option.installmentPrice)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption ? (
                    <div className="mt-5 grid grid-cols-2 gap-3 md:mt-6 md:gap-4">
                      <div className="rounded-2xl border border-white/10 bg-[#111] p-4">
                        <p className="text-xs text-zinc-500">Tamamı Peşin</p>
                        <p className="mt-1 text-lg font-bold text-white md:text-xl">
                          {formatPrice(selectedOption.cashPrice)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[#111] p-4">
                        <p className="text-xs text-zinc-500">Parçalı Ödeme</p>
                        <p className="mt-1 text-lg font-bold text-zinc-400 md:text-xl">
                          {formatPrice(selectedOption.installmentPrice)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 space-y-2 border-t border-white/10 bg-black px-4 py-4 md:px-6 md:py-5">
                  <div className="flex flex-col gap-2 md:grid md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setInspectOpen(true)}
                      disabled={!selectedOptionInspectEnabled}
                      className="w-full rounded-2xl bg-[#222] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 md:py-3.5"
                    >
                      İncele
                    </button>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!selectedOption}
                      className="w-full rounded-2xl bg-[#93f8b6] py-3 text-sm font-semibold text-black disabled:opacity-50 md:py-3.5"
                    >
                      Sepete Ekle
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickRequest}
                      disabled={!selectedOption}
                      className="w-full rounded-2xl border border-white/20 py-3 text-sm font-semibold text-white disabled:opacity-50 md:py-3.5"
                    >
                      Hemen Talep Oluştur
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {category ? (
        <PackageInspectSheet
          open={inspectOpen}
          category={category}
          selectedOptionId={selectedOption?.id ?? null}
          onClose={() => setInspectOpen(false)}
          onBack={() => setInspectOpen(false)}
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
