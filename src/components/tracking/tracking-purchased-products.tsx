"use client";

import { useState } from "react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PurchasedProductInspectSheet } from "@/components/tracking/purchased-product-inspect-sheet";
import { CartItemThumbnail } from "@/components/packages/cart-item-thumbnail";
import { resolveFullDayStoryCoverageLabel } from "@/lib/full-day-story-coverage";

const previewClassName =
  "relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] sm:w-24";

export function TrackingPurchasedProducts({
  products,
  sectionsTagsOnly = false,
  staticMode = false,
}: {
  products: ReservationProductSnapshot[];
  sectionsTagsOnly?: boolean;
  /** PDF / statik önizleme: tıklanabilir kart yerine özet liste. */
  staticMode?: boolean;
}) {
  const [selectedProduct, setSelectedProduct] =
    useState<ReservationProductSnapshot | null>(null);

  if (products.length === 0) return null;

  return (
    <>
      <section className="mt-10">
        <SectionHeading>Satın Alınan Ürünler</SectionHeading>
        <ul className="mt-5 space-y-4">
          {products.map((product) => {
            const coverageLabel = resolveFullDayStoryCoverageLabel(
              product.serviceAreaTitle,
              product.packageTitle ?? "",
              product.packageTags,
              product.serviceAreaSlug,
            );
            const packageLine = coverageLabel || product.packageTitle;

            const cardBody = (
              <>
                <div className="flex gap-3 sm:gap-4">
                  <CartItemThumbnail
                    imageUrl={product.previewImageUrl}
                    videoUrl={product.previewVideoUrl}
                    className={previewClassName}
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-xl font-bold tracking-tight sm:text-2xl"
                      style={{ color: product.accentColor }}
                    >
                      {product.serviceAreaTitle}
                    </h3>
                    {packageLine ? (
                      <p
                        className={
                          coverageLabel
                            ? "mt-0.5 text-sm font-medium leading-snug text-zinc-300"
                            : "mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500"
                        }
                      >
                        {packageLine}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-base font-semibold leading-tight text-white/90 sm:text-lg">
                      {product.shootTypeLabelRaw || product.shootTypeLabel}
                    </p>
                    {product.highlightTags.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {product.highlightTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs"
                            style={{
                              borderColor: `${product.accentColor}88`,
                              color: product.accentColor,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2 flex items-start gap-6 border-t border-white/10 pt-3 sm:gap-8">
                  <PaymentTypePrice type="pesin" price={product.cashPrice} />
                  <PaymentTypePrice
                    type="taksitli"
                    price={product.installmentPrice}
                  />
                </div>

                {staticMode ? null : (
                  <p className="mt-4 text-center text-[11px] text-zinc-500 sm:text-xs">
                    Detaylar için dokunun
                  </p>
                )}
              </>
            );

            if (staticMode) {
              return (
                <li
                  key={product.shootTypeId}
                  className="rounded-2xl border p-4 sm:p-5"
                  style={{
                    borderColor: `${product.accentColor}55`,
                    backgroundColor: `${product.accentColor}0c`,
                  }}
                >
                  {cardBody}
                </li>
              );
            }

            return (
              <li key={product.shootTypeId}>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="w-full rounded-2xl border p-4 text-left transition hover:brightness-110 sm:p-5"
                  style={{
                    borderColor: `${product.accentColor}55`,
                    backgroundColor: `${product.accentColor}0c`,
                  }}
                >
                  {cardBody}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {staticMode ? null : (
        <PurchasedProductInspectSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          sectionsTagsOnly={sectionsTagsOnly}
        />
      )}
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
      {children}
    </h2>
  );
}
