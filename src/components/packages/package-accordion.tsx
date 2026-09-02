"use client";

import type {
  PackageData,
  ServiceAreaData,
  ShootTypeData,
} from "@/lib/package-types";
import { resolveNestedPackageAccentColor } from "@/lib/package-types";
import { PackageCartToggleButton } from "@/components/packages/package-cart-toggle-button";
import { formatPrice } from "@/lib/constants";
import { usePaymentTypeCopy } from "@/components/site-settings-provider";

type PackageListProps = {
  serviceArea: ServiceAreaData;
  onSelectShootType: (pkg: PackageData, shootType: ShootTypeData) => void;
  /** Hizmet alanı accordion'unun içindeyse daha sıkı boşluk. */
  nested?: boolean;
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

  return (
    <div className="flex items-start gap-2 border-t border-white/[0.06] py-1.5 first:border-t-0 sm:gap-3 sm:py-2">
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-white">
        {shootType.label}
      </p>

      <div className="flex shrink-0 items-end gap-2.5 sm:gap-3.5">
        <div className="text-right leading-none">
          <p className="text-[9px] text-zinc-500 sm:text-[10px]">
            {paymentLabels.pesin}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-zinc-200 sm:text-xs">
            {formatPrice(shootType.cashPrice)}
          </p>
        </div>
        <div className="text-right leading-none">
          <p className="text-[9px] text-zinc-500 sm:text-[10px]">
            {paymentLabels.taksitli}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-zinc-400 sm:text-xs">
            {formatPrice(shootType.installmentPrice)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onSelect}
          className="rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors hover:bg-white/5 sm:text-xs"
          style={{
            borderColor: `${accentColor}55`,
            color: accentColor,
          }}
        >
          İncele
        </button>
        <PackageCartToggleButton
          serviceArea={serviceArea}
          pkg={pkg}
          shootType={shootType}
          accentColor={accentColor}
          variant="icon"
        />
      </div>
    </div>
  );
}

/** Hizmet alanı altındaki paketler — accordion yok; kompakt sabit liste. */
export function PackageAccordion({
  serviceArea,
  onSelectShootType,
  nested = false,
}: PackageListProps) {
  const packageCount = serviceArea.packages.length;

  return (
    <div className={nested ? "mt-1.5 space-y-2" : "mt-8 space-y-3"}>
      {serviceArea.packages.map((pkg, index) => {
        const accentColor = resolveNestedPackageAccentColor(
          serviceArea,
          index,
          packageCount,
        );

        return (
          <div
            key={pkg.id}
            className="rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-3 sm:px-4 sm:py-3.5"
          >
            <div className="min-w-0">
              <p
                className="flex items-center gap-2 text-xl font-semibold leading-tight tracking-tight sm:text-2xl"
                style={{ color: accentColor }}
              >
                <span
                  className="mt-[0.15em] h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2"
                  style={{ backgroundColor: accentColor }}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{pkg.title}</span>
              </p>
              {pkg.tags.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {pkg.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-medium leading-none sm:text-xs"
                      style={{
                        borderColor: `${accentColor}44`,
                        color: `${accentColor}`,
                        backgroundColor: `${accentColor}12`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-2.5">
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
          </div>
        );
      })}
    </div>
  );
}
