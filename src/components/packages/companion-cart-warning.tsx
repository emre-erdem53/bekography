"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { getCompanionRequirementMessage } from "@/lib/cart-companion-rules";
import { useCartUiStore } from "@/stores/cart-ui-store";

export function CompanionCartWarning() {
  const open = useCartUiStore((state) => state.companionWarningOpen);
  const close = useCartUiStore((state) => state.closeCompanionWarning);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/50"
            aria-label="Uyarıyı kapat"
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="companion-cart-warning-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-[86] w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-400/30 bg-[#1c1510] p-4 shadow-2xl sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p
                id="companion-cart-warning-title"
                className="min-w-0 flex-1 text-sm leading-relaxed text-amber-50"
              >
                {getCompanionRequirementMessage()}
              </p>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-full p-1 text-amber-200/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
