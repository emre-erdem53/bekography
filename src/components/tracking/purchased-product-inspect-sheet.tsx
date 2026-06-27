"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PackageOptionDetailBody } from "@/components/packages/package-option-detail-body";
import { BekographyBrand } from "@/components/bekography-brand";

export function PurchasedProductInspectSheet({
  product,
  onClose,
}: {
  product: ReservationProductSnapshot | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [product]);

  const sections = [...(product?.detailSections ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex flex-col bg-black"
        >
          <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                aria-label="Geri dön"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                Sipariş Takibi
              </button>
              <BekographyBrand size="sm" href={null} className="hover:opacity-100" />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-lg px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:px-6 sm:pb-8">
              <PackageOptionDetailBody
                categoryTitle={product.categoryTitle}
                optionLabel={product.optionLabel}
                highlightTags={product.highlightTags}
                cashPrice={product.cashPrice}
                installmentPrice={product.installmentPrice}
                detailSections={sections}
                showGallery={false}
                sectionsEmptyMessage="Bu ürün için kayıtlı inceleme metni bulunmuyor."
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
