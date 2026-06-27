"use client";

import { useState } from "react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { PurchasedProductInspectSheet } from "@/components/tracking/purchased-product-inspect-sheet";

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
                className="w-full rounded-2xl border border-white/10 bg-black p-5 text-left transition hover:border-white/25 sm:p-6"
              >
                <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {product.categoryTitle}
                </h3>
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

                <div className="mt-4 flex items-start gap-6 sm:mt-5 sm:gap-8">
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
