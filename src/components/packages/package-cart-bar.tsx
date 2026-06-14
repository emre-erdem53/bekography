"use client";

import { useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice, PAYMENT_TYPE_LABELS } from "@/lib/constants";
import { useCartStore } from "@/stores/cart-store";
import { RequestModal } from "@/components/packages/request-modal";

export function PackageCartBar() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotal = useCartStore((state) => state.getTotal);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-2 text-sm text-white"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>{items.length} paket</span>
            <span className="text-zinc-400">— {formatPrice(getTotal())}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            Talep Oluştur
          </button>
        </div>

        {expanded ? (
          <div className="border-t border-white/10 px-4 py-3">
            <ul className="mx-auto max-w-6xl space-y-2">
              {items.map((item) => (
                <li
                  key={`${item.packageOptionId}-${item.paymentType}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-300">
                    {item.categoryTitle} — {item.optionLabel} (
                    {PAYMENT_TYPE_LABELS[item.paymentType]})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white">{formatPrice(item.unitPrice)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.packageOptionId, item.paymentType)
                      }
                      className="text-zinc-500 hover:text-white"
                      aria-label="Kaldır"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <RequestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
