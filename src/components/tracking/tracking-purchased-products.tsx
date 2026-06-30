"use client";

import { useState } from "react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PurchasedProductInspectSheet } from "@/components/tracking/purchased-product-inspect-sheet";
import { CartItemThumbnail } from "@/components/packages/cart-item-thumbnail";

const previewClassName =
  "relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] sm:w-24";

export function TrackingPurchasedProducts({
  products,
  sectionsTagsOnly = false,
}: {
  products: ReservationProductSnapshot[];
  sectionsTagsOnly?: boolean;
}) {
  const [selectedProduct, setSelectedProduct] =
    useState<ReservationProductSnapshot | null>(null);

  if (products.length === 0) return null;

  return (
    <>
      <section className="mt-10">
        <SectionHeading>Satın Alınan Ürünler</SectionHeading>
        <ul className="mt-5 space-y-4">
          {products.map((product) => (
            <li key={product.packageOptionId}>
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="w-full rounded-2xl border p-4 text-left transition hover:brightness-110 sm:p-5"
                style={{
                  borderColor: `${product.accentColor}55`,
                  backgroundColor: `${product.accentColor}0c`,
                }}
              >
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
                      {product.categoryTitle}
                    </h3>
                    <p className="mt-0.5 text-base font-semibold leading-tight text-white/90 sm:text-lg">
                      {product.optionLabel}
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

                <p className="mt-4 text-center text-[11px] text-zinc-500 sm:text-xs">
                  Detaylar için dokunun
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <PurchasedProductInspectSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        sectionsTagsOnly={sectionsTagsOnly}
      />
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
