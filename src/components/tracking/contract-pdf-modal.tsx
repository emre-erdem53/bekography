"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, X } from "lucide-react";

const CONTRACT_PDF_PATH = "/contracts/sozlesme.pdf";

export function ContractPdfModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col bg-black/90"
          onClick={onClose}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 pt-[max(env(safe-area-inset-top),0.75rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-medium text-white">Sözleşme</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="min-h-0 flex-1 p-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <iframe
              src={CONTRACT_PDF_PATH}
              title="Sözleşme"
              className="h-full w-full rounded-xl border border-white/10 bg-white"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ContractLinkButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08]"
    >
      <FileText className="h-4 w-4 shrink-0" />
      Sözleşmeyi Görüntüle
    </button>
  );
}

export function useContractPdfModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  };
}
