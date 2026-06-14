"use client";

import { useState } from "react";
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

  if (!category) return null;

  const content = category.content as PackageCategoryContent;
  const selectedOption =
    category.options.find((o) => o.id === selectedOptionId) ??
    category.options[0];
  const galleryUrls = getCategoryGalleryUrls(category);
  const tags = content.highlightTags ?? [];

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 top-0 mx-auto flex max-w-md flex-col bg-black md:top-8 md:rounded-t-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2
                  className="text-2xl font-semibold"
                  style={{ color: category.accentColor }}
                >
                  {content.displayTitle ?? category.title}
                </h2>
                {selectedOption ? (
                  <p className="text-sm text-zinc-400">{selectedOption.label}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
              {tags.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-200"
                    >
                      • {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <PackageGalleryCarousel images={galleryUrls} />

              <div className="mt-5 space-y-2">
                {category.options.map((option) => {
                  const active =
                    (selectedOptionId ?? category.options[0]?.id) === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 bg-[#111]"
                      }`}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: category.accentColor }}
                      >
                        {option.label}
                      </span>
                      <div className="text-right text-xs">
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
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-zinc-500">Tamamı Peşin</p>
                    <p className="text-xl font-bold text-white">
                      {formatPrice(selectedOption.cashPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Parçalı Ödeme</p>
                    <p className="text-xl font-bold text-zinc-500">
                      {formatPrice(selectedOption.installmentPrice)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-white/10 bg-black px-4 py-4">
              <button
                type="button"
                onClick={() => setInspectOpen(true)}
                className="w-full rounded-2xl bg-[#222] py-3.5 text-sm font-semibold text-white"
              >
                İncele
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedOption}
                className="w-full rounded-2xl bg-[#93f8b6] py-3.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                Sepete Ekle
              </button>
              <button
                type="button"
                onClick={handleQuickRequest}
                disabled={!selectedOption}
                className="w-full rounded-2xl border border-white/20 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Hemen Talep Oluştur
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <PackageInspectSheet
        open={inspectOpen}
        category={category}
        onClose={() => setInspectOpen(false)}
        onBack={() => setInspectOpen(false)}
      />

      <RequestModal
        open={requestOpen}
        onClose={() => {
          setRequestOpen(false);
          setSingleRequestItems([]);
        }}
        itemsOverride={singleRequestItems}
        clearCartOnSuccess={false}
      />
    </>
  );
}
