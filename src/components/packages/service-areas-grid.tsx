import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ServiceAreaData } from "@/lib/package-types";
import { PackageIconDisplay } from "@/components/packages/package-icon";

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
    <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:gap-3">
      {serviceAreas.map((serviceArea) => (
        <Link
          key={serviceArea.id}
          href={`/paketler/${serviceArea.slug}`}
          className="group flex min-h-14 w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#0a0a0a] px-3.5 py-3 transition-colors hover:bg-[#111] active:bg-[#141414] sm:min-h-16 sm:gap-4 sm:px-5 sm:py-4"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
            style={{ backgroundColor: `${serviceArea.accentColor}22` }}
          >
            <PackageIconDisplay
              iconKey={serviceArea.iconKey}
              className="h-5 w-5 sm:h-6 sm:w-6"
              style={{ color: serviceArea.accentColor }}
              imageSizes="24px"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className="block truncate text-lg font-semibold leading-tight sm:text-2xl"
              style={{ color: serviceArea.accentColor }}
            >
              {serviceArea.title}
            </span>
            {serviceArea.tags.length > 0 ? (
              <span className="mt-1 flex flex-wrap gap-1.5">
                {serviceArea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-zinc-400 sm:text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
          </span>

          <ChevronRight
            className="h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ))}
    </div>
  );
}
