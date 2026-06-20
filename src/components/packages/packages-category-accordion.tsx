"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { PackageCategoryData, PackageOptionData } from "@/lib/package-types";
import type { PackageCategoryContent } from "@/lib/package-seed-data";
import { PackageIconDisplay } from "@/components/packages/package-icon";
import { getOptionIconKey } from "@/lib/package-option-icon";
import { PaymentTypePrice } from "@/components/packages/payment-type-price";

type PackagesCategoryAccordionProps = {
  categories: PackageCategoryData[];
  expandedCategoryId: string | null;
  onToggleCategory: (categoryId: string) => void;
  onSelectOption: (
    category: PackageCategoryData,
    option: PackageOptionData,
  ) => void;
};

function OptionRow({
  category,
  option,
  onSelect,
}: {
  category: PackageCategoryData;
  option: PackageOptionData;
  onSelect: () => void;
}) {
  const content = category.content as PackageCategoryContent;
  const iconKey = getOptionIconKey(option, content);
  const tags =
    content.highlightTagsByOption?.[option.id] ??
    content.highlightTagsByOption?.[option.label] ??
    [];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-3 text-left transition-colors hover:border-white/20 hover:bg-[#111] sm:gap-4 sm:px-4 sm:py-3.5"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
        style={{ backgroundColor: `${category.accentColor}18` }}
      >
        <PackageIconDisplay
          iconKey={iconKey}
          className="h-4 w-4 sm:h-5 sm:w-5"
          style={{ color: category.accentColor }}
          imageSizes="20px"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-sm font-semibold sm:text-base"
          style={{ color: category.accentColor }}
        >
          {option.label}
        </span>
        {tags.length > 0 ? (
          <span className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      <span className="grid shrink-0 grid-cols-2 gap-3 sm:gap-5">
        <PaymentTypePrice
          type="pesin"
          price={option.cashPrice}
          variant="minimal"
          align="right"
        />
        <PaymentTypePrice
          type="taksitli"
          price={option.installmentPrice}
          variant="minimal"
          align="right"
        />
      </span>
    </button>
  );
}

export function PackagesCategoryAccordion({
  categories,
  expandedCategoryId,
  onToggleCategory,
  onSelectOption,
}: PackagesCategoryAccordionProps) {
  return (
    <div className="mt-8 space-y-3">
      {categories.map((category) => {
        const isOpen = expandedCategoryId === category.id;

        return (
          <div
            key={category.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
          >
            <button
              type="button"
              onClick={() => onToggleCategory(category.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#111] sm:px-5 sm:py-4"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ backgroundColor: `${category.accentColor}22` }}
              >
                <PackageIconDisplay
                  iconKey={category.iconKey}
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: category.accentColor }}
                  imageSizes="24px"
                />
              </span>
              <span
                className="min-w-0 flex-1 text-base font-semibold sm:text-lg"
                style={{ color: category.accentColor }}
              >
                {category.title}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 border-t border-white/10 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                    {category.options.map((option) => (
                      <OptionRow
                        key={option.id}
                        category={category}
                        option={option}
                        onSelect={() => onSelectOption(category, option)}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
