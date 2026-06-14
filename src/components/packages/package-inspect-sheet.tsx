"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import type { PackageCategoryData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";

type PackageInspectSheetProps = {
  open: boolean;
  category: PackageCategoryData;
  onClose: () => void;
  onBack: () => void;
};

export function PackageInspectSheet({
  open,
  category,
  onClose,
  onBack,
}: PackageInspectSheetProps) {
  const content = category.content as PackageCategoryContent;
  const sections = [...(content.detailSections ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black"
        >
          <div className="mx-auto flex h-full max-w-md flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
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
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <h3
                className="text-2xl font-semibold"
                style={{ color: category.accentColor }}
              >
                {content.displayTitle ?? category.title}
              </h3>

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
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                        {section.body}
                      </p>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
