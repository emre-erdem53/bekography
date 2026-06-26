"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReservationProductSnapshot } from "@/lib/reservation-product-snapshot";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";
import { CartItemThumbnail } from "@/components/packages/cart-item-thumbnail";

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

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] overflow-hidden bg-black/95"
        >
          <div className="flex h-full w-full items-end justify-center md:items-center md:p-6 lg:p-10">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="flex h-[100dvh] w-full max-h-[100dvh] flex-col overflow-hidden bg-black md:h-auto md:max-h-[min(85vh,720px)] md:max-w-xl md:rounded-3xl md:border md:border-white/10 md:shadow-2xl lg:max-w-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
                <h2 className="text-sm font-semibold text-white">
                  Satın Alınan Paket
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-zinc-400 hover:text-white"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-6">
                <div className="flex gap-3">
                  <CartItemThumbnail
                    imageUrl={product.previewImageUrl}
                    videoUrl={product.previewVideoUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-xl font-semibold md:text-2xl"
                      style={{ color: product.accentColor }}
                    >
                      {product.categoryTitle}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {product.optionLabel}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  Bu içerik rezervasyon oluşturulduğu andaki paket halini
                  gösterir.
                </p>

                {product.shootDescription ? (
                  <section className="mt-6 border-t border-white/10 pt-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                      Çekim
                    </h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                      {product.shootDescription}
                    </p>
                  </section>
                ) : null}

                {product.services.length > 0 ? (
                  <section className="mt-6 border-t border-white/10 pt-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-white">
                      Hizmetler
                    </h4>
                    <ul className="mt-3 space-y-3">
                      {product.services.map((service) => (
                        <li key={service.title}>
                          <p className="text-sm font-medium text-white">
                            {service.title}
                          </p>
                          {service.subLines.length > 0 ? (
                            <ul className="mt-1 space-y-0.5">
                              {service.subLines.map((line) => (
                                <li
                                  key={line}
                                  className="text-sm text-zinc-400"
                                >
                                  {line}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {product.detailSections.length > 0 ? (
                  <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
                    {product.detailSections.map((section) => (
                      <section key={section.id}>
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
                      </section>
                    ))}
                  </div>
                ) : null}

                {product.detailSections.length === 0 &&
                !product.shootDescription &&
                product.services.length === 0 ? (
                  <p className="mt-6 text-sm text-zinc-500">
                    Bu ürün için kayıtlı detay bilgisi bulunmuyor.
                  </p>
                ) : null}

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
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
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
