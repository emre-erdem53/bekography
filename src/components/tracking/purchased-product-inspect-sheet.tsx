"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PackageGalleryCarousel } from "@/components/packages/package-gallery-carousel";
import {
  PackageInspectSections,
  PackageSnapshotServicesGrid,
  PackageSnapshotShootBlocks,
} from "@/components/packages/package-snapshot-content-blocks";
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
              <header className="mb-4 sm:mb-5">
                <h2
                  className="text-2xl font-bold tracking-tight sm:text-3xl"
                  style={{ color: product.accentColor }}
                >
                  {product.categoryTitle}
                </h2>
                <p className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                  {product.optionLabel}
                </p>
                {product.highlightTags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                    {product.highlightTags.map((tag) => (
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

              <p className="mb-4 text-center text-[11px] text-zinc-500 sm:text-xs">
                Bu içerik rezervasyon oluşturulduğu andaki paket halini gösterir.
              </p>

              {product.galleryMedia.length > 0 ? (
                <PackageGalleryCarousel
                  media={product.galleryMedia}
                  variant="detail"
                />
              ) : null}

              <PackageSnapshotServicesGrid product={product} />
              <PackageSnapshotShootBlocks product={product} />

              <div className="mt-4 flex items-start gap-6 sm:mt-5 sm:gap-8">
                <PaymentTypePrice type="pesin" price={product.cashPrice} />
                <PaymentTypePrice
                  type="taksitli"
                  price={product.installmentPrice}
                />
              </div>

              <section className="mt-5 border-t border-white/10 pt-5 sm:mt-6 sm:pt-6">
                <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500">
                  <ChevronDown
                    className="h-4 w-4 shrink-0 animate-bounce"
                    aria-hidden
                  />
                  <span>İncele</span>
                </div>

                <PackageInspectSections
                  sections={sections}
                  emptyMessage="Bu ürün için kayıtlı inceleme metni bulunmuyor."
                />
              </section>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
