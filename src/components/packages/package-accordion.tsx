"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { resolvePackageAccentColor } from "@/lib/package-types";
import { PackageIconDisplay } from "@/components/packages/package-icon";
import { PackageCartToggleButton } from "@/components/packages/package-cart-toggle-button";
import { getShootTypeIconKey } from "@/lib/package-option-icon";
import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type PackageAccordionProps = {
  serviceArea: ServiceAreaData;
  expandedPackageId: string | null;
  onTogglePackage: (packageId: string) => void;
  onSelectShootType: (pkg: PackageData, shootType: ShootTypeData) => void;
};

function ShootTypeRow({
  serviceArea,
  pkg,
  shootType,
  accentColor,
  onSelect,
}: {
  serviceArea: ServiceAreaData;
  pkg: PackageData;
  shootType: ShootTypeData;
  accentColor: string;
  onSelect: () => void;
}) {
  const { labels: paymentLabels } = usePaymentTypeCopy();
  const iconKey = getShootTypeIconKey(shootType);

  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <PackageIconDisplay
          iconKey={iconKey}
          className="h-4 w-4 sm:h-5 sm:w-5"
          style={{ color: accentColor }}
          imageSizes="20px"
        />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold leading-tight sm:text-base"
          style={{ color: accentColor }}
        >
          {shootType.label}
        </p>
        {shootType.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {shootType.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-2">
        <div className="flex flex-col gap-1.5 text-right">
          <div>
            <p className="text-[10px] leading-none text-zinc-500">
              {paymentLabels.pesin}
            </p>
            <p className="mt-0.5 text-xs font-bold leading-none text-white sm:text-sm">
              {formatPrice(shootType.cashPrice)}
            </p>
          </div>
          <div>
            <p className="text-[10px] leading-none text-zinc-500">
              {paymentLabels.taksitli}
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-none text-zinc-400 sm:text-sm">
              {formatPrice(shootType.installmentPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSelect}
            className="rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors hover:bg-white/5 sm:px-3 sm:text-xs"
            style={{
              borderColor: `${accentColor}66`,
              color: accentColor,
            }}
          >
            İncele
          </button>
          <PackageCartToggleButton
            serviceArea={serviceArea}
            pkg={pkg}
            shootType={shootType}
            variant="icon"
          />
        </div>
      </div>
    </div>
  );
}

export function PackageAccordion({
  serviceArea,
  expandedPackageId,
  onTogglePackage,
  onSelectShootType,
}: PackageAccordionProps) {
  return (
    <div className="mt-8 space-y-3">
      {serviceArea.packages.map((pkg) => {
        const isOpen = expandedPackageId === pkg.id;
        const accentColor = resolvePackageAccentColor(pkg, serviceArea);

        return (
          <div
            key={pkg.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
          >
            <button
              type="button"
              onClick={() => onTogglePackage(pkg.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#111] sm:px-5 sm:py-4"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ backgroundColor: `${accentColor}22` }}
              >
                <PackageIconDisplay
                  iconKey={pkg.iconKey || serviceArea.iconKey}
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: accentColor }}
                  imageSizes="24px"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block text-xl font-semibold leading-tight sm:text-2xl md:text-3xl"
                  style={{ color: accentColor }}
                >
                  {pkg.title}
                </span>
                {pkg.tags.length > 0 ? (
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {pkg.tags.map((tag) => (
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
                    {pkg.shootTypes.map((shootType) => (
                      <ShootTypeRow
                        key={shootType.id}
                        serviceArea={serviceArea}
                        pkg={pkg}
                        shootType={shootType}
                        accentColor={accentColor}
                        onSelect={() => onSelectShootType(pkg, shootType)}
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
