"use client";

import { useState } from "react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { CartItemThumbnail } from "@/components/packages/cart-item-thumbnail";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PurchasedProductInspectSheet } from "@/components/tracking/purchased-product-inspect-sheet";

export function TrackingPurchasedProducts({
  products,
}: {
  products: ReservationProductSnapshot[];
}) {
  const [selectedProduct, setSelectedProduct] =
    useState<ReservationProductSnapshot | null>(null);

  if (products.length === 0) return null;

  return (
    <>
      <section className="mt-10">
        <SectionHeading>Satın Alınan Ürünler</SectionHeading>
        <ul className="mt-5 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {products.map((product) => (
            <li key={product.packageOptionId}>
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 text-left transition hover:border-white/25 hover:bg-[#111] md:p-5"
              >
                <div className="flex gap-3">
                  <CartItemThumbnail
                    imageUrl={product.previewImageUrl}
                    videoUrl={product.previewVideoUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="font-semibold md:text-lg"
                      style={{ color: product.accentColor }}
                    >
                      {product.categoryTitle}
                    </p>
                    <p className="text-sm text-zinc-400">{product.optionLabel}</p>
                    {product.highlightTags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.highlightTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-zinc-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/5 pt-3 md:mt-4">
                  <PaymentTypePrice
                    type="pesin"
                    price={product.cashPrice}
                    variant="stacked"
                  />
                  <PaymentTypePrice
                    type="taksitli"
                    price={product.installmentPrice}
                    variant="stacked"
                  />
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Detayları görüntülemek için dokunun
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <PurchasedProductInspectSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
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
