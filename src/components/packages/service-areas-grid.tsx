import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ServiceAreaData } from "@/lib/package-types";
import { PackageIconDisplay } from "@/components/packages/package-icon";
import { getServiceAreaPriceLabel } from "@/lib/package-media";

/**
 * `/paketler` ve anasayfa bölümünde gösterilen hizmet alanı kartları.
 * Karta tıklayınca o hizmet alanının paket listesine gidilir.
 */
export function ServiceAreasGrid({
  serviceAreas,
}: {
  serviceAreas: ServiceAreaData[];
}) {
  if (serviceAreas.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-zinc-500">
        Şu anda görüntülenecek bir hizmet alanı yok.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {serviceAreas.map((serviceArea) => {
        const shootTypeCount = serviceArea.packages.reduce(
          (total, pkg) => total + pkg.shootTypes.length,
          0,
        );
        const priceLabel = getServiceAreaPriceLabel(serviceArea);

        return (
          <Link
            key={serviceArea.id}
            href={`/paketler/${serviceArea.slug}`}
            className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 transition-colors hover:bg-[#111] sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${serviceArea.accentColor}22` }}
              >
                <PackageIconDisplay
                  iconKey={serviceArea.iconKey}
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: serviceArea.accentColor }}
                  imageSizes="24px"
                />
              </span>
              <span
                className="min-w-0 flex-1 text-xl font-semibold leading-tight sm:text-2xl"
                style={{ color: serviceArea.accentColor }}
              >
                {serviceArea.title}
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>

            {serviceArea.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {serviceArea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="text-xs text-zinc-500">
              {serviceArea.packages.length} paket · {shootTypeCount} çekim türü
              {priceLabel ? ` · ${priceLabel}` : ""}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
