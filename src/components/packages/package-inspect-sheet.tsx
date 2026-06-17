"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

type PackageInspectSheetProps = {
  open: boolean;
  category: PackageCategoryData;
  selectedOptionId: string | null;
  onClose: () => void;
  onBack: () => void;
};

export function PackageInspectSheet({
  open,
  category,
  selectedOptionId,
  onClose,
  onBack,
}: PackageInspectSheetProps) {
  const content = category.content as PackageCategoryContent;
  const selectedOption =
    category.options.find((option) => option.id === selectedOptionId) ??
    category.options[0];
  const optionKey = selectedOption?.id ?? "";
  const optionLabelKey = selectedOption?.label ?? "";
  const scopedSections =
    content.detailSectionsByOption?.[optionKey] ??
    content.detailSectionsByOption?.[optionLabelKey] ??
    content.detailSections;
  const sections = [...(scopedSections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
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
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Geri
                </button>
                <h2 className="text-sm font-semibold text-white">İncele</h2>
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
                <h3
                  className="text-xl font-semibold md:text-2xl"
                  style={{ color: category.accentColor }}
                >
                  {content.displayTitle ?? category.title}
                </h3>
                {selectedOption ? (
                  <p className="mt-1 text-sm text-zinc-400">{selectedOption.label}</p>
                ) : null}

                {sections.length === 0 ? (
                  <p className="mt-6 text-sm text-zinc-500">
                    Bu paket için detay bilgisi yakında eklenecek.
                  </p>
                ) : (
                  <div className="mt-6 space-y-6">
                    {sections.map((section) => (
                      <section key={section.id}>
                        <h4 className="text-lg font-semibold text-white">
                          {section.title}
                        </h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400 md:text-base">
                          {section.body}
                        </p>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
